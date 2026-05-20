import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { documentAssignments, users, type DocumentAssignment } from "../db/schema.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";

function assignmentsBucket(): string {
  return process.env.SUPABASE_ASSIGNMENTS_BUCKET ?? "assigned-documents";
}

function sanitizePdfFilename(name: string): string {
  const base = name.trim() || "document.pdf";
  const cleaned = base.replace(/[^\w.\-\sàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/g, "").slice(0, 200);
  return cleaned.length > 0 ? cleaned : "document.pdf";
}

function serializeAssignment(row: DocumentAssignment) {
  return {
    id: row.id,
    document_id: row.documentId,
    document_title: row.documentTitle,
    storage_path: row.storagePath,
    assigned_at: row.assignedAt.toISOString(),
    user_id: row.userId,
    assigned_by: row.assignedBy,
  };
}

async function findTargetUser(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email.trim().toLowerCase()),
  });
}

export async function createAssignment(req: Request, res: Response): Promise<void> {
  const { assignedToEmail, documentId, documentTitle } = req.body as {
    assignedToEmail?: string;
    documentId?: string;
    documentTitle?: string;
  };

  if (!assignedToEmail || !documentId || !documentTitle) {
    res.status(400).json({ error: "assignedToEmail, documentId et documentTitle requis" });
    return;
  }

  const target = await findTargetUser(assignedToEmail);

  if (!target) {
    res.status(404).json({ error: "Utilisateur destinataire introuvable" });
    return;
  }

  const [assignment] = await db
    .insert(documentAssignments)
    .values({
      userId: target.id,
      documentId,
      documentTitle,
      assignedBy: req.user!.id,
    })
    .returning();

  res.status(201).json({ assignment: serializeAssignment(assignment) });
}

/** Attribution avec téléversement PDF (stockage Supabase Storage). */
export async function createAssignmentFromUpload(req: Request, res: Response): Promise<void> {
  const rawEmail = req.body?.assignedToEmail;
  const assignedToEmail =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const file = req.file;

  if (!assignedToEmail || !file?.buffer) {
    res.status(400).json({ error: "assignedToEmail et un fichier PDF sont requis" });
    return;
  }

  const looksPdf =
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/x-pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (!looksPdf) {
    res.status(400).json({ error: "Seuls les fichiers PDF sont acceptés" });
    return;
  }

  const maxBytes = 15 * 1024 * 1024;
  if (file.size > maxBytes) {
    res.status(400).json({ error: "PDF trop volumineux (maximum 15 Mo)" });
    return;
  }

  const target = await findTargetUser(assignedToEmail);

  if (!target) {
    res.status(404).json({ error: "Utilisateur destinataire introuvable" });
    return;
  }

  const documentId = randomUUID();
  const bucket = assignmentsBucket();
  const storagePath = `${req.user!.id}/${documentId}.pdf`;
  const supabaseAdmin = getSupabaseAdmin();

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, file.buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("createAssignmentFromUpload storage:", uploadError);
    res.status(500).json({
      error:
        `Échec du stockage du fichier (bucket « ${bucket} »). Créez le bucket dans Supabase ou définissez SUPABASE_ASSIGNMENTS_BUCKET.`,
    });
    return;
  }

  try {
    const [assignment] = await db
      .insert(documentAssignments)
      .values({
        userId: target.id,
        documentId,
        documentTitle: sanitizePdfFilename(file.originalname),
        assignedBy: req.user!.id,
        storagePath,
      })
      .returning();

    res.status(201).json({ assignment: serializeAssignment(assignment) });
  } catch (error) {
    console.error("createAssignmentFromUpload insert:", error);
    await supabaseAdmin.storage.from(bucket).remove([storagePath]).catch(() => undefined);
    res.status(500).json({ error: "Erreur lors de l'attribution" });
  }
}

export async function listAssignments(req: Request, res: Response): Promise<void> {
  const rows = await db
    .select({
      assignment: documentAssignments,
      assignedUser: {
        email: users.email,
        displayName: users.displayName,
      },
    })
    .from(documentAssignments)
    .leftJoin(users, eq(documentAssignments.userId, users.id))
    .where(eq(documentAssignments.assignedBy, req.user!.id))
    .orderBy(desc(documentAssignments.assignedAt));

  res.json({
    assignments: rows.map(({ assignment, assignedUser }) => ({
      ...serializeAssignment(assignment),
      users: assignedUser?.email
        ? {
            email: assignedUser.email,
            display_name: assignedUser.displayName,
          }
        : null,
    })),
  });
}

/** Documents attribués au client connecté. */
export async function listMyAssignments(req: Request, res: Response): Promise<void> {
  const rows = await db.query.documentAssignments.findMany({
    where: eq(documentAssignments.userId, req.user!.id),
    orderBy: (assignments, { desc }) => [desc(assignments.assignedAt)],
  });

  res.json({ assignments: rows.map(serializeAssignment) });
}

/** URL signée temporaire pour télécharger un PDF stocké par le labo. */
export async function getAssignmentSignedUrl(req: Request, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  if (!assignmentId || typeof assignmentId !== "string") {
    res.status(400).json({ error: "Identifiant manquant" });
    return;
  }

  const assignment = await db.query.documentAssignments.findFirst({
    where: and(
      eq(documentAssignments.id, assignmentId),
      eq(documentAssignments.userId, req.user!.id)
    ),
  });

  if (!assignment) {
    res.status(404).json({ error: "Attribution introuvable" });
    return;
  }

  if (!assignment.storagePath) {
    res.status(404).json({
      error:
        "Ce document est un exemple sans fichier joint ; utilisez les parcours Téléverser ou saisie manuelle avec vos propres données.",
    });
    return;
  }

  const { data: signed, error } = await getSupabaseAdmin().storage
    .from(assignmentsBucket())
    .createSignedUrl(assignment.storagePath, 600);

  if (error || !signed?.signedUrl) {
    console.error("getAssignmentSignedUrl:", error);
    res.status(500).json({ error: "Impossible de générer le lien de téléchargement" });
    return;
  }

  res.json({ signedUrl: signed.signedUrl });
}
