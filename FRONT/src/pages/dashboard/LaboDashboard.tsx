import { useEffect, useRef, useState, type ReactElement } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import UiButton from "../../components/UiButton";
import ImageCropModal from "../../components/ImageCropModal";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useScrollAnimations } from "../../hooks/useScrollAnimations";
import { apiGet, apiPost, apiPostFormData } from "../../lib/api";
import {
  ASSIGNMENT_PDF_MAX_BYTES,
  isAssignmentImageFile,
  isAssignmentPdfFile,
  isAssignmentTextFile,
  prepareAssignmentPdf,
  rasterBlobToAssignmentPdf,
} from "../../lib/prepareAssignmentPdf";
import { getPdfPageCount, renderPdfPageAsPngBlob } from "../../lib/renderPdfFirstPageAsPng";
import { UPLOAD_FILE_ACCEPT, UPLOAD_FILE_FORMATS_LABEL } from "../../constants/uploadFormats";
import type { DocumentAssignment, ManagedLabAccount } from "../../types/auth";

type PdfAssignStep = "pdf_pick_action" | "pdf_crop_page" | null;

// ── Mapping types API → types frontend ────────────────────────────────────────

interface ApiUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
}

interface ApiAssignment {
  id: string;
  document_id: string;
  document_title: string;
  storage_path?: string | null;
  assigned_at: string;
  users: { email: string; display_name: string } | null;
}

function toAccount(u: ApiUser): ManagedLabAccount {
  return { id: u.id, email: u.email, displayName: u.display_name, createdAt: u.created_at };
}

function toAssignment(a: ApiAssignment): DocumentAssignment {
  return {
    id: a.id,
    documentId: a.document_id,
    documentTitle: a.document_title,
    assignedToEmail: a.users?.email ?? "",
    assignedAt: a.assigned_at,
    storagePath: a.storage_path ?? null,
  };
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function LaboDashboard(): ReactElement | null {
  const { user } = useAuth();
  useScrollAnimations();
  usePageTitle("Gestion laboratoire");

  const [accounts,    setAccounts]    = useState<ManagedLabAccount[]>([]);
  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);

  const [newEmail,       setNewEmail]       = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword,    setNewPassword]    = useState("");
  const [formMsg,        setFormMsg]        = useState("");
  const [formLoading,    setFormLoading]    = useState(false);

  const [assignEmail, setAssignEmail] = useState("");
  const [assignRawFile, setAssignRawFile] = useState<File | null>(null);
  const [assignPreparedPdf, setAssignPreparedPdf] = useState<File | null>(null);
  const [assignmentPdfObjectUrl, setAssignmentPdfObjectUrl] = useState<string | null>(null);
  const [assignConverting, setAssignConverting] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const assignFileInputRef = useRef<HTMLInputElement>(null);
  const [assignMsg,     setAssignMsg]     = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  /** Raster PNG de la page PDF recadrée (conservé pour rouvrir la modale). */
  const pdfPageRasterRef = useRef<Blob | null>(null);
  const [pdfAssignStep, setPdfAssignStep] = useState<PdfAssignStep>(null);
  const [assignPdfTotalPages, setAssignPdfTotalPages] = useState<number | null>(null);
  const [assignPdfCropPage, setAssignPdfCropPage] = useState(1);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (assignPreparedPdf) {
      objectUrl = URL.createObjectURL(assignPreparedPdf);
      setAssignmentPdfObjectUrl(objectUrl);
    } else {
      setAssignmentPdfObjectUrl(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assignPreparedPdf]);

  /** Libère la prévisualisation de recadrage et remet à zéro le champ fichier. */
  const teardownAssignmentUpload = (): void => {
    setAssignRawFile(null);
    setAssignPreparedPdf(null);
    setAssignConverting(false);
    setCropModalOpen(false);
    setPdfAssignStep(null);
    pdfPageRasterRef.current = null;
    setAssignPdfTotalPages(null);
    setAssignPdfCropPage(1);
    setCropPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (assignFileInputRef.current) assignFileInputRef.current.value = "";
  };

  const openCropPreview = (file: File): void => {
    setCropPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setCropModalOpen(true);
  };

  const reopenAssignmentCrop = (): void => {
    if (!assignRawFile || cropModalOpen || assignConverting) return;
    setAssignMsg("");
    if (isAssignmentImageFile(assignRawFile)) {
      openCropPreview(assignRawFile);
      return;
    }
    const raster = pdfPageRasterRef.current;
    if (!isAssignmentPdfFile(assignRawFile) || !raster) return;
    setCropPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(raster);
    });
    setCropModalOpen(true);
    setPdfAssignStep("pdf_crop_page");
  };

  const canReopenAssignmentCrop =
    Boolean(assignPreparedPdf) &&
    Boolean(assignRawFile) &&
    !cropModalOpen &&
    !assignConverting &&
    (assignRawFile
      ? isAssignmentImageFile(assignRawFile) ||
        (isAssignmentPdfFile(assignRawFile) && pdfPageRasterRef.current !== null)
      : false);

  const endCropModal = (): void => {
    setCropModalOpen(false);
    setCropPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleCropModalDismiss = (): void => {
    if (pdfAssignStep === "pdf_crop_page") {
      endCropModal();
      if (!assignPreparedPdf) {
        pdfPageRasterRef.current = null;
        setPdfAssignStep("pdf_pick_action");
      } else {
        setPdfAssignStep(null);
      }
      setAssignMsg("");
      return;
    }
    if (assignPreparedPdf && assignRawFile) {
      endCropModal();
      return;
    }
    teardownAssignmentUpload();
  };

  const handleUseFullImageFromModal = (): void => {
    if (pdfAssignStep === "pdf_crop_page") {
      const raster = pdfPageRasterRef.current;
      const name = assignRawFile?.name ?? "document.pdf";
      if (!raster || !assignRawFile) return;
      endCropModal();
      setPdfAssignStep(null);
      void preparePdfFromRasterBlob(name, raster);
      return;
    }
    if (!assignRawFile) return;
    endCropModal();
    void preparePdfFromAssignmentFile(assignRawFile, null);
  };

  const handleCroppedFromModal = (blob: Blob): void => {
    const name = assignRawFile?.name ?? "document.pdf";
    if (pdfAssignStep === "pdf_crop_page" && assignRawFile) {
      endCropModal();
      setPdfAssignStep(null);
      void preparePdfFromRasterBlob(name, blob);
      return;
    }
    if (!assignRawFile) return;
    endCropModal();
    void preparePdfFromAssignmentFile(assignRawFile, blob);
  };

  const preparePdfFromRasterBlob = async (
    originalFilename: string,
    raster: Blob,
  ): Promise<void> => {
    setAssignConverting(true);
    setAssignMsg("");
    try {
      const pdfFile = await rasterBlobToAssignmentPdf(raster, originalFilename);
      setAssignPreparedPdf(pdfFile);
      setAssignMsg("PDF prêt. Vérifiez l’aperçu ci-dessous ; vous pouvez corriger le recadrage si besoin.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Conversion impossible.";
      setAssignMsg(msg);
      teardownAssignmentUpload();
    } finally {
      setAssignConverting(false);
    }
  };

  const preparePdfFromAssignmentFile = async (raw: File, imageBlob?: Blob | null): Promise<void> => {
    setAssignConverting(true);
    setAssignMsg("");
    try {
      const pdfFile = await prepareAssignmentPdf(raw, imageBlob ?? undefined);
      setAssignPreparedPdf(pdfFile);
      setAssignMsg("PDF prêt. Vérifiez l’aperçu ci-dessous ; vous pouvez corriger le recadrage si besoin.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Conversion impossible.";
      setAssignMsg(msg);
      teardownAssignmentUpload();
    } finally {
      setAssignConverting(false);
    }
  };

  /** Fichier choisi depuis l’input : images → recadrage ; le reste → conversion PDF immédiate. */
  const onAssignmentFilePicked = (file: File | null): void => {
    setAssignMsg("");
    if (!file) {
      teardownAssignmentUpload();
      return;
    }
    if (file.size > ASSIGNMENT_PDF_MAX_BYTES) {
      setAssignMsg("Fichier trop volumineux (15 Mo max avant conversion).");
      if (assignFileInputRef.current) assignFileInputRef.current.value = "";
      return;
    }
    setAssignRawFile(file);
    setAssignPreparedPdf(null);
    setPdfAssignStep(null);
    pdfPageRasterRef.current = null;
    setAssignPdfTotalPages(null);
    setAssignPdfCropPage(1);

    if (isAssignmentImageFile(file)) {
      openCropPreview(file);
      return;
    }

    if (isAssignmentPdfFile(file)) {
      setPdfAssignStep("pdf_pick_action");
      setAssignMsg("Choisissez : envoyer le PDF en entier ou recadrer une page au choix (nouveau PDF d’une page).");
      return;
    }

    void preparePdfFromAssignmentFile(file, null);
  };

  useEffect(() => {
    const f = assignRawFile;
    if (!f || !isAssignmentPdfFile(f) || pdfAssignStep !== "pdf_pick_action") return;
    let cancelled = false;
    setAssignPdfTotalPages(null);
    void getPdfPageCount(f)
      .then((n) => {
        if (!cancelled && n >= 1) setAssignPdfTotalPages(n);
      })
      .catch(() => {
        if (!cancelled) setAssignPdfTotalPages(null);
      });
    return () => {
      cancelled = true;
    };
  }, [assignRawFile, pdfAssignStep]);

  useEffect(() => {
    if (assignPdfTotalPages == null || assignPdfTotalPages < 1) return;
    setAssignPdfCropPage((p) => Math.min(Math.max(1, p), assignPdfTotalPages));
  }, [assignPdfTotalPages]);

  const beginPdfPageCropForUi = (): void => {
    if (!assignRawFile || !isAssignmentPdfFile(assignRawFile)) return;
    const total = assignPdfTotalPages ?? 1;
    const page = Math.min(Math.max(1, assignPdfCropPage), total);
    setAssignMsg("");
    setAssignConverting(true);
    void (async () => {
      try {
        const pngBlob = await renderPdfPageAsPngBlob(assignRawFile, page);
        pdfPageRasterRef.current = pngBlob;
        setCropPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(pngBlob);
        });
        setCropModalOpen(true);
        setPdfAssignStep("pdf_crop_page");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Impossible d’afficher cette page pour recadrage.";
        setAssignMsg(msg);
      } finally {
        setAssignConverting(false);
      }
    })();
  };

  // ── Chargement initial ───────────────────────────────────────────────────────

  useEffect(() => {
    apiGet<{ users: ApiUser[] }>("/users")
      .then(({ users }) => {
        const mapped = users.map(toAccount);
        setAccounts(mapped);
        if (mapped.length > 0) setAssignEmail(mapped[0].email);
      })
      .catch(() => { /* silencieux, tableau vide */ });

    apiGet<{ assignments: ApiAssignment[] }>("/assignments")
      .then(({ assignments }) => setAssignments(assignments.map(toAssignment)))
      .catch(() => { /* silencieux, tableau vide */ });
  }, []);

  if (!user) return null;

  // ── Créer un compte ──────────────────────────────────────────────────────────

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormMsg("");
    if (!newEmail || !newDisplayName || !newPassword) {
      setFormMsg("Tous les champs sont requis.");
      return;
    }
    setFormLoading(true);
    try {
      const { user: created } = await apiPost<{ user: ApiUser }>("/users", {
        email: newEmail,
        displayName: newDisplayName,
        password: newPassword,
      });
      const account = toAccount(created);
      setAccounts((prev) => [...prev, account]);
      setNewEmail("");
      setNewDisplayName("");
      setNewPassword("");
      setFormMsg("Compte créé avec succès.");
      setAssignEmail(account.email);
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Attribuer un document ────────────────────────────────────────────────────

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setAssignMsg("");
    setAssignLoading(true);
    try {
      if (
        !assignPreparedPdf ||
        cropModalOpen ||
        pdfAssignStep === "pdf_pick_action"
      ) {
        setAssignMsg(
          pdfAssignStep === "pdf_pick_action"
            ? "Indiquez d’abord si vous envoyez le PDF complet ou si vous recadrez une page."
            : "Choisissez un fichier et terminez la conversion ou le recadrage avant d’attribuer.",
        );
        return;
      }
      const fd = new FormData();
      fd.append("assignedToEmail", assignEmail);
      fd.append("pdf", assignPreparedPdf);
      const { assignment } = await apiPostFormData<{ assignment: ApiAssignment }>("/assignments/upload", fd);
      setAssignments((prev) => [toAssignment(assignment), ...prev]);
      setAssignMsg(`PDF « ${assignment.document_title} » attribué à ${assignEmail}.`);
      teardownAssignmentUpload();
    } catch (err) {
      setAssignMsg(err instanceof Error ? err.message : "Erreur lors de l'attribution.");
    } finally {
      setAssignLoading(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main id="main-content" role="main" className="flex-1 px-4 pt-28 pb-16 max-w-5xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-raspberry-600 mb-1">
            Gestionnaire laboratoire
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Espace administration — {user.displayName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Créer un compte */}
          <section aria-labelledby="create-account-title" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 id="create-account-title" className="text-lg font-semibold text-gray-900 mb-4">
              Créer un compte utilisateur labo
            </h2>
            <form onSubmit={(e) => { void handleCreateAccount(e); }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="new-account-email" className="text-sm font-medium text-gray-700">E-mail</label>
                <input
                  id="new-account-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="new-account-name" className="text-sm font-medium text-gray-700">Nom affiché</label>
                <input
                  id="new-account-name"
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="new-account-password" className="text-sm font-medium text-gray-700">Mot de passe</label>
                <input
                  id="new-account-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              {formMsg && <p role="status" className="text-sm text-gray-600">{formMsg}</p>}
              <UiButton type="submit" bg="raspberry" text="white" className="w-fit px-6" disabled={formLoading}>
                {formLoading ? "Création..." : "Créer le compte"}
              </UiButton>
            </form>
          </section>

          {/* Attribuer un document */}
          <section aria-labelledby="assign-doc-title" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 id="assign-doc-title" className="text-lg font-semibold text-gray-900 mb-1">
              Attribuer un document
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Choisissez un fichier ({UPLOAD_FILE_FORMATS_LABEL}), converti en PDF dans le navigateur.{" "}
              <strong>PNG / JPG</strong> — fenêtre de recadrage à la sélection.{" "}
              <strong>PDF</strong> — envoi complet ou recadrage d’une <strong>page au choix</strong>.&nbsp;
              <strong>CSV / TXT</strong> — PDF automatique. Après conversion, un aperçu s’affiche : vous pouvez rouvrir le recadrage avant d’attribuer.
            </p>
            <form onSubmit={(e) => { void handleAssign(e); }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="assign-user" className="text-sm font-medium text-gray-700">Compte destinataire</label>
                <select
                  id="assign-user"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  disabled={accounts.length === 0}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400 disabled:bg-gray-50"
                >
                  {accounts.length === 0
                    ? <option value="">Aucun compte créé</option>
                    : accounts.map((a) => (
                        <option key={a.id} value={a.email}>{a.displayName} ({a.email})</option>
                      ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="assign-pdf-file" className="text-sm font-medium text-gray-700">
                  Fichier à attribuer
                </label>
                <input
                  ref={assignFileInputRef}
                  id="assign-pdf-file"
                  type="file"
                  accept={UPLOAD_FILE_ACCEPT}
                  disabled={assignConverting || assignLoading || cropModalOpen}
                  onChange={(e) => onAssignmentFilePicked(e.target.files?.[0] ?? null)}
                  className="text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-raspberry-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-raspberry-800 hover:file:bg-raspberry-200 disabled:opacity-60"
                />
                {assignConverting ? (
                  <p className="text-xs text-gray-600" aria-live="polite">
                    Préparation en cours (conversion ou rendu d’une page PDF)…
                  </p>
                ) : null}
                {assignRawFile &&
                !assignPreparedPdf &&
                pdfAssignStep === "pdf_pick_action" &&
                isAssignmentPdfFile(assignRawFile) ? (
                  <div
                    className="rounded-xl border-2 border-raspberry-400 bg-linear-to-br from-raspberry-50 to-white p-4 flex flex-col gap-3 shadow-sm"
                    role="region"
                    aria-label="Choix avant envoi du PDF"
                  >
                    <p className="text-sm font-semibold text-gray-900">Votre fichier est un PDF</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      • <strong>PDF complet</strong> — toutes les pages sont envoyées telles quelles.&nbsp;
                      • <strong>Recadrer une page</strong> — indiquez le numéro ci-dessous, puis ouvrez l’outil de recadrage (nouveau PDF d’une page).
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                      <div className="flex flex-col gap-1 shrink-0">
                        <label htmlFor="assign-pdf-crop-page" className="text-xs font-medium text-gray-700">
                          Numéro de page
                          {assignPdfTotalPages != null ? ` (1 à ${assignPdfTotalPages})` : " (chargement…)"}
                        </label>
                        <input
                          id="assign-pdf-crop-page"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={assignPdfTotalPages ?? 999999}
                          disabled={assignConverting || assignPdfTotalPages == null}
                          value={assignPdfCropPage}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!Number.isFinite(v)) return;
                            const cap = assignPdfTotalPages ?? Math.max(1, v);
                            setAssignPdfCropPage(Math.min(Math.max(1, Math.floor(v)), cap));
                          }}
                          className="w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400 disabled:bg-gray-50"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <UiButton
                          type="button"
                          bg="raspberry"
                          text="white"
                          className="px-4 py-2"
                          disabled={assignConverting}
                          onClick={() => {
                            if (!assignRawFile) return;
                            setPdfAssignStep(null);
                            void preparePdfFromAssignmentFile(assignRawFile, null);
                          }}
                        >
                          PDF complet (toutes les pages)
                        </UiButton>
                        <UiButton
                          type="button"
                          bg="white"
                          text="raspberry"
                          className="px-4 py-2 border border-raspberry-200"
                          disabled={
                            assignConverting || assignPdfTotalPages == null || (assignPdfTotalPages ?? 0) < 1
                          }
                          onClick={() => beginPdfPageCropForUi()}
                        >
                          Recadrer cette page
                        </UiButton>
                      </div>
                    </div>
                  </div>
                ) : null}
                {assignRawFile && !assignConverting ? (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Source : {assignRawFile.name}</p>
                    {cropModalOpen ? (
                      <p className="text-xs font-semibold text-raspberry-700" aria-live="polite">
                        Fenêtre de recadrage ouverte au premier plan — désactivez un éventuel bloqueur ou faites défiler vers le centre de l&apos;écran.
                      </p>
                    ) : null}
                    {!assignPreparedPdf &&
                    assignRawFile &&
                    isAssignmentImageFile(assignRawFile) &&
                    !cropModalOpen ? (
                      <p className="text-xs text-raspberry-700">
                        Si aucune fenêtre ne s’est ouverte après la sélection, rechargez la page puis réessayez.
                      </p>
                    ) : null}
                    {!assignPreparedPdf && assignRawFile && isAssignmentTextFile(assignRawFile) ? (
                      <p className="text-xs text-gray-500">
                        Fichier texte ou CSV → conversion automatique vers PDF lorsque c’est terminé.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {assignPreparedPdf && assignmentPdfObjectUrl ? (
                  <div
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3"
                    role="region"
                    aria-labelledby="assignment-pdf-preview-title"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <h3 id="assignment-pdf-preview-title" className="text-sm font-semibold text-gray-900">
                        Aperçu du PDF généré
                      </h3>
                      {canReopenAssignmentCrop ? (
                        <UiButton
                          type="button"
                          bg="white"
                          text="raspberry"
                          className="shrink-0 px-4 py-2 border border-gray-200"
                          disabled={assignConverting || assignLoading || cropModalOpen}
                          onClick={() => reopenAssignmentCrop()}
                        >
                          Modifier recadrage / masques
                        </UiButton>
                      ) : null}
                    </div>
                    {!canReopenAssignmentCrop && assignRawFile && assignPreparedPdf ? (
                      <p className="text-xs text-gray-600">
                        Le recadrage ne peut être rouvert que pour une image ou pour un PDF exporté en PNG page par page. Pour un PDF entier, un CSV ou du texte, réinitialisez le fichier pour recommencer.
                      </p>
                    ) : null}
                    <p className="text-xs text-gray-500">
                      Fichier prêt : {assignPreparedPdf.name}
                    </p>
                    <iframe
                      title="Aperçu du PDF avant attribution"
                      src={assignmentPdfObjectUrl}
                      className="w-full min-h-[min(50vh,520px)] rounded-lg border border-gray-200 bg-white"
                    />
                  </div>
                ) : null}

                {(assignRawFile || assignPreparedPdf) && !assignConverting ? (
                  <button
                    type="button"
                    className="text-sm text-raspberry-600 underline self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded"
                    onClick={() => { teardownAssignmentUpload(); }}
                  >
                    Réinitialiser le fichier
                  </button>
                ) : null}
              </div>
              {assignMsg && <p role="status" className="text-sm text-gray-600">{assignMsg}</p>}
              <UiButton
                type="submit"
                bg="raspberry"
                text="white"
                className="w-fit px-6"
                disabled={
                  accounts.length === 0 ||
                  assignLoading ||
                  assignConverting ||
                  cropModalOpen ||
                  pdfAssignStep === "pdf_pick_action" ||
                  !assignPreparedPdf
                }
              >
                {assignLoading ? "Attribution..." : "Attribuer"}
              </UiButton>
            </form>
          </section>
        </div>

        {/* Tableau des comptes */}
        <section aria-labelledby="accounts-table-title" className="mt-10">
          <h2 id="accounts-table-title" className="text-lg font-semibold text-gray-900 mb-3">
            Comptes créés ({accounts.length})
          </h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun compte pour le moment.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Nom</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">E-mail</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-800">{a.displayName}</td>
                      <td className="px-4 py-3 text-gray-600">{a.email}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tableau des attributions */}
        <section aria-labelledby="assignments-table-title" className="mt-10 mb-6">
          <h2 id="assignments-table-title" className="text-lg font-semibold text-gray-900 mb-3">
            Documents attribués ({assignments.length})
          </h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune attribution enregistrée.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Document</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Type</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Destinataire</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-800">{r.documentTitle}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.storagePath ? "PDF stocké" : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.assignedToEmail}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(r.assignedAt).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />

      <ImageCropModal
        open={cropModalOpen && Boolean(cropPreviewUrl)}
        imageSrc={cropPreviewUrl ?? ""}
        onDismiss={handleCropModalDismiss}
        onUseFullImage={handleUseFullImageFromModal}
        onCropped={handleCroppedFromModal}
      />
    </div>
  );
}
