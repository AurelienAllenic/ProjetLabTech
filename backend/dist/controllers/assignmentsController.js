import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase.js";
function assignmentsBucket() {
    return process.env.SUPABASE_ASSIGNMENTS_BUCKET ?? "assigned-documents";
}
function sanitizePdfFilename(name) {
    const base = name.trim() || "document.pdf";
    const cleaned = base.replace(/[^\w.\-\sàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/g, "").slice(0, 200);
    return cleaned.length > 0 ? cleaned : "document.pdf";
}
export async function createAssignment(req, res) {
    const { assignedToEmail, documentId, documentTitle } = req.body;
    if (!assignedToEmail || !documentId || !documentTitle) {
        res.status(400).json({ error: "assignedToEmail, documentId et documentTitle requis" });
        return;
    }
    const { data: target, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", assignedToEmail.trim().toLowerCase())
        .single();
    if (userErr || !target) {
        res.status(404).json({ error: "Utilisateur destinataire introuvable" });
        return;
    }
    const { data, error } = await supabase
        .from("document_assignments")
        .insert({
        user_id: target.id,
        document_id: documentId,
        document_title: documentTitle,
        assigned_by: req.user.userId,
    })
        .select()
        .single();
    if (error) {
        console.error("createAssignment error:", error);
        res.status(500).json({ error: "Erreur lors de l'attribution" });
        return;
    }
    res.status(201).json({ assignment: data });
}
/** Attribution avec téléversement PDF (stockage Supabase Storage). */
export async function createAssignmentFromUpload(req, res) {
    const rawEmail = req.body?.assignedToEmail;
    const assignedToEmail = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const file = req.file;
    if (!assignedToEmail || !file?.buffer) {
        res.status(400).json({ error: "assignedToEmail et un fichier PDF sont requis" });
        return;
    }
    const looksPdf = file.mimetype === "application/pdf" ||
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
    const { data: target, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", assignedToEmail)
        .single();
    if (userErr || !target) {
        res.status(404).json({ error: "Utilisateur destinataire introuvable" });
        return;
    }
    const documentId = randomUUID();
    const bucket = assignmentsBucket();
    const storagePath = `${req.user.userId}/${documentId}.pdf`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file.buffer, {
        contentType: "application/pdf",
        upsert: false,
    });
    if (uploadError) {
        console.error("createAssignmentFromUpload storage:", uploadError);
        res.status(500).json({
            error: `Échec du stockage du fichier (bucket « ${bucket} »). Créez le bucket dans Supabase ou définissez SUPABASE_ASSIGNMENTS_BUCKET.`,
        });
        return;
    }
    const documentTitle = sanitizePdfFilename(file.originalname);
    const { data, error } = await supabase
        .from("document_assignments")
        .insert({
        user_id: target.id,
        document_id: documentId,
        document_title: documentTitle,
        assigned_by: req.user.userId,
        storage_path: storagePath,
    })
        .select()
        .single();
    if (error) {
        console.error("createAssignmentFromUpload insert:", error);
        await supabase.storage.from(bucket).remove([storagePath]).catch(() => undefined);
        res.status(500).json({ error: "Erreur lors de l'attribution" });
        return;
    }
    res.status(201).json({ assignment: data });
}
export async function listAssignments(req, res) {
    const { data, error } = await supabase
        .from("document_assignments")
        .select(`
      id,
      document_id,
      document_title,
      storage_path,
      assigned_at,
      users!document_assignments_user_id_fkey ( email, display_name )
    `)
        .eq("assigned_by", req.user.userId)
        .order("assigned_at", { ascending: false });
    if (error) {
        console.error("listAssignments error:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des attributions" });
        return;
    }
    res.json({ assignments: data });
}
/** Documents attribués au compte utilisateur labo connecté. */
export async function listMyAssignments(req, res) {
    const { data, error } = await supabase
        .from("document_assignments")
        .select("id, document_id, document_title, storage_path, assigned_at")
        .eq("user_id", req.user.userId)
        .order("assigned_at", { ascending: false });
    if (error) {
        console.error("listMyAssignments error:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des documents" });
        return;
    }
    res.json({ assignments: data });
}
/** URL signée temporaire pour télécharger un PDF stocké par le labo. */
export async function getAssignmentSignedUrl(req, res) {
    const { assignmentId } = req.params;
    if (!assignmentId || typeof assignmentId !== "string") {
        res.status(400).json({ error: "Identifiant manquant" });
        return;
    }
    const bucket = assignmentsBucket();
    const { data: row, error } = await supabase
        .from("document_assignments")
        .select("storage_path")
        .eq("id", assignmentId)
        .eq("user_id", req.user.userId)
        .maybeSingle();
    if (error || !row) {
        res.status(404).json({ error: "Attribution introuvable" });
        return;
    }
    if (!row.storage_path) {
        res.status(404).json({
            error: "Ce document est un exemple sans fichier joint ; utilisez les parcours Téléverser ou saisie manuelle avec vos propres données.",
        });
        return;
    }
    const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(row.storage_path, 600);
    if (signErr || !signed?.signedUrl) {
        console.error("getAssignmentSignedUrl:", signErr);
        res.status(500).json({ error: "Impossible de générer le lien de téléchargement" });
        return;
    }
    res.json({ signedUrl: signed.signedUrl });
}
