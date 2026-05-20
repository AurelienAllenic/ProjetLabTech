import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let workerConfigured = false;

function ensurePdfWorker(): void {
  if (workerConfigured) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  workerConfigured = true;
}

/**
 * Rend une page d’un PDF (index **1-based**, comme pdf.js) dans un PNG (recadrage côté client).
 */
export async function renderPdfPageAsPngBlob(
  file: File,
  pageNumber: number,
  scale = 2,
): Promise<Blob> {
  ensurePdfWorker();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const pdf = await loadingTask.promise;
  try {
    const n = pdf.numPages;
    const idx = Math.min(Math.max(1, Math.floor(pageNumber)), n);
    const page = await pdf.getPage(idx);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas non disponible pour le rendu PDF.");
    }
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
    await renderTask.promise;
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export PNG impossible."))),
        "image/png",
      );
    });
  } finally {
    await pdf.destroy().catch(() => undefined);
  }
}

/** Alias : page 1 uniquement (rétrocompatibilité). */
export async function renderPdfFirstPageAsPngBlob(file: File, scale = 2): Promise<Blob> {
  return renderPdfPageAsPngBlob(file, 1, scale);
}

/** Nombre de pages (pour choisir une page à recadrer). */
export async function getPdfPageCount(file: File): Promise<number> {
  ensurePdfWorker();
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
  try {
    return pdf.numPages;
  } finally {
    await pdf.destroy().catch(() => undefined);
  }
}
