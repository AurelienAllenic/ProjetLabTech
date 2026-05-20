import { jsPDF } from "jspdf";

export const ASSIGNMENT_PDF_MAX_BYTES = 15 * 1024 * 1024;

function ensurePdfUnderLimit(f: File): File {
  if (f.size > ASSIGNMENT_PDF_MAX_BYTES) {
    throw new Error("Le PDF généré dépasse 15 Mo. Réduisez la taille de l’image ou du texte.");
  }
  return f;
}

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function baseNameForPdf(originalName: string): string {
  const n = originalName.replace(/\\/g, "/").split("/").pop() ?? "document";
  const dot = n.lastIndexOf(".");
  const base = dot > 0 ? n.slice(0, dot) : n;
  const safe = base.replace(/[^\w.\-\sàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]/gi, "").trim() || "document";
  return `${safe}.pdf`;
}

export function isAssignmentImageFile(file: File): boolean {
  if (/^image\/(jpeg|jpg|png)$/i.test(file.type)) return true;
  const e = ext(file.name);
  return e === ".jpg" || e === ".jpeg" || e === ".png";
}

export function isAssignmentPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return ext(file.name) === ".pdf";
}

export function isAssignmentTextFile(file: File): boolean {
  if (file.type === "text/plain" || file.type === "text/csv" || file.type === "application/csv") return true;
  const e = ext(file.name);
  return e === ".txt" || e === ".csv";
}

function loadImageDataUrl(blob: Blob): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas non disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      URL.revokeObjectURL(url);
      resolve({ dataUrl, w, h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

/** Image (fichier ou blob recadré) → une page PDF A4, image centrée et mise à l’échelle. */
async function imageBlobToPdfBlob(imageBlob: Blob, originalName: string): Promise<File> {
  const { dataUrl, w, h } = await loadImageDataUrl(imageBlob);
  const pdf = new jsPDF({ orientation: h >= w ? "p" : "l", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const maxW = pageW - 2 * margin;
  const maxH = pageH - 2 * margin;
  const imgWmm = (w * 25.4) / 96;
  const imgHmm = (h * 25.4) / 96;
  const scale = Math.min(maxW / imgWmm, maxH / imgHmm, 1);
  const dw = imgWmm * scale;
  const dh = imgHmm * scale;
  const x = margin + (maxW - dw) / 2;
  const y = margin + (maxH - dh) / 2;
  pdf.addImage(dataUrl, "JPEG", x, y, dw, dh, undefined, "FAST");
  const out = pdf.output("blob");
  return ensurePdfUnderLimit(new File([out], baseNameForPdf(originalName), { type: "application/pdf" }));
}

/**
 * Convertit une image déjà découpée (PNG/JPEG…) en fichier PDF attribuable (une page A4 mise à l’échelle).
 * Utilisé pour le recadrage de la première page d’un PDF (raster) ou tout autre raster.
 */
export async function rasterBlobToAssignmentPdf(blob: Blob, originalFilenameWithExt: string): Promise<File> {
  return imageBlobToPdfBlob(blob, originalFilenameWithExt);
}

function textToPdfBlob(text: string, originalName: string): File {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 12;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - 2 * margin;
  const lineH = 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  const lines = pdf.splitTextToSize(text, maxW);
  let y = margin;

  for (const line of lines) {
    if (y + lineH > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineH;
  }

  const out = pdf.output("blob");
  return ensurePdfUnderLimit(new File([out], baseNameForPdf(originalName), { type: "application/pdf" }));
}

/**
 * Prépare le fichier à envoyer au backend (toujours un PDF).
 * - PDF : renvoyé tel quel (si taille OK).
 * - Image : `imageBlob` = recadrage optionnel ; sinon le fichier original est utilisé.
 * - TXT / CSV : rendu en PDF multi-pages si besoin.
 */
export async function prepareAssignmentPdf(
  file: File,
  imageBlob?: Blob | null,
): Promise<File> {
  if (file.size > ASSIGNMENT_PDF_MAX_BYTES) {
    throw new Error("Fichier trop volumineux (maximum 15 Mo avant conversion).");
  }

  if (isAssignmentPdfFile(file)) {
    return file;
  }

  if (isAssignmentImageFile(file)) {
    const blob = imageBlob ?? file;
    return imageBlobToPdfBlob(blob, file.name);
  }

  if (isAssignmentTextFile(file)) {
    const text = await file.text();
    return textToPdfBlob(text, file.name);
  }

  throw new Error("Format non pris en charge. Utilisez PDF, CSV, TXT, PNG ou JPG.");
}
