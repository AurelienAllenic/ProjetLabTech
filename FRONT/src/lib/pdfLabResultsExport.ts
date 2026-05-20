import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { prepareDomSubtreeForHtml2Canvas, removePdfDecorativeLucideIcons } from "./pdfExportStyles";

const PDF_PAGE_W_MM = 210;
const PDF_PAGE_H_MM = 297;
const PDF_MARGIN_MM = 14;
/** Espacement vertical entre deux blocs capturés */
const PDF_GAP_MM = 10;
const PDF_CONTENT_W_MM = PDF_PAGE_W_MM - 2 * PDF_MARGIN_MM;

/** Largeur fixe en px pour stabiliser la mise en page et les graphiques Recharts hors écran */
const CAPTURE_SHELL_WIDTH_PX = 780;

function buildPdfTitleBlock(): HTMLElement {
  const root = document.createElement("div");

  const band = document.createElement("div");
  Object.assign(band.style, {
    borderBottom: "3px solid #2563eb",
    paddingBottom: "16px",
    marginBottom: "12px",
  });

  const h1 = document.createElement("h1");
  h1.textContent = "Résultats médicaux — Lab'IA";
  Object.assign(h1.style, {
    margin: "0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "1.35",
    letterSpacing: "0.02em",
  });

  const dateLine = document.createElement("p");
  dateLine.textContent = `Export du ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}`;
  Object.assign(dateLine.style, {
    margin: "14px 0 0",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.65",
    letterSpacing: "0.015em",
  });

  band.appendChild(h1);
  band.appendChild(dateLine);

  const note = document.createElement("p");
  note.textContent =
    "Document à visée informative. Les graphiques sont reproduits dans leur intégralité ; la décision médicale appartient toujours à un professionnel de santé.";
  Object.assign(note.style, {
    margin: "0",
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.65",
    maxWidth: "640px",
  });

  root.appendChild(band);
  root.appendChild(note);
  return root;
}

function buildPdfDetailIntroBlock(): HTMLElement {
  const root = document.createElement("div");
  const h2 = document.createElement("h2");
  h2.textContent = "Résultats détaillés";
  Object.assign(h2.style, {
    margin: "0 0 8px 0",
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
    lineHeight: "1.35",
    letterSpacing: "0.02em",
  });
  const sub = document.createElement("p");
  sub.textContent = "Valeurs mesurées, intervalles de référence et interprétations.";
  Object.assign(sub.style, {
    margin: "0",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: "1.65",
    letterSpacing: "0.02em",
  });
  root.appendChild(h2);
  root.appendChild(sub);
  return root;
}

function buildPdfFooterBlock(): HTMLElement {
  const root = document.createElement("div");
  Object.assign(root.style, {
    paddingTop: "12px",
    borderTop: "1px solid #e2e8f0",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.65",
    letterSpacing: "0.02em",
  });
  const p1 = document.createElement("p");
  p1.style.margin = "0 0 10px 0";
  p1.style.lineHeight = "1.65";
  p1.style.letterSpacing = "0.02em";
  const s1 = document.createElement("strong");
  s1.textContent = "Avis important : ";
  p1.appendChild(s1);
  p1.appendChild(document.createTextNode("ce document ne remplace pas un avis médical."));
  const p2 = document.createElement("p");
  p2.style.margin = "0";
  p2.textContent =
    "Consultez votre médecin ou votre biologiste pour interpréter vos analyses dans votre contexte personnel.";
  root.appendChild(p1);
  root.appendChild(p2);
  return root;
}

function stripInteractiveArtifacts(root: HTMLElement): void {
  root.querySelectorAll("[tabindex]").forEach((el) => el.removeAttribute("tabindex"));
  root.removeAttribute("tabindex");
}

/** Hauteur image (mm) pour une largeur cible donnée */
function canvasSizeMm(canvas: HTMLCanvasElement, widthMm: number): { wMm: number; hMm: number } {
  const hMm = (canvas.height * widthMm) / canvas.width;
  return { wMm: widthMm, hMm };
}

/** Réduit proportionnellement si le bloc dépasse la zone utile d'une page */
function scaleToFitPage(wMm: number, hMm: number, maxHm: number): { wMm: number; hMm: number } {
  if (hMm <= maxHm) return { wMm, hMm };
  const scale = maxHm / hMm;
  return { wMm: wMm * scale, hMm: maxHm };
}

function collectPdfSegments(): HTMLElement[] {
  const segments: HTMLElement[] = [];

  segments.push(buildPdfTitleBlock());

  const summaryCopy = document.querySelector<HTMLElement>('[data-pdf-segment="summary-copy"]');
  if (summaryCopy) {
    segments.push(summaryCopy.cloneNode(true) as HTMLElement);
  }

  const conclusionSeg = document.querySelector<HTMLElement>('[data-pdf-segment="conclusion"]');
  if (conclusionSeg) {
    segments.push(conclusionSeg.cloneNode(true) as HTMLElement);
  }

  const bars = document.querySelector<HTMLElement>('[data-pdf-segment="chart-bars-block"]');
  if (bars) {
    segments.push(bars.cloneNode(true) as HTMLElement);
  }

  const pie = document.querySelector<HTMLElement>('[data-pdf-segment="chart-pie-block"]');
  if (pie) {
    segments.push(pie.cloneNode(true) as HTMLElement);
  }

  const articles = document.querySelectorAll<HTMLElement>("#main-content article");
  if (articles.length > 0) {
    segments.push(buildPdfDetailIntroBlock());
  }

  articles.forEach((article) => {
    const chartWrap = article.querySelector<HTMLElement>('[data-pdf-segment="parameter-chart"]');

    const bodyClone = article.cloneNode(true) as HTMLElement;
    bodyClone.querySelectorAll('[data-pdf-segment="parameter-chart"]').forEach((el) => el.remove());
    stripInteractiveArtifacts(bodyClone);
    segments.push(bodyClone);

    if (chartWrap) {
      segments.push(chartWrap.cloneNode(true) as HTMLElement);
    }
  });

  segments.push(buildPdfFooterBlock());
  return segments;
}

async function captureSegmentInShell(content: HTMLElement): Promise<HTMLCanvasElement> {
  const shell = document.createElement("div");
  Object.assign(shell.style, {
    position: "absolute",
    left: "-12000px",
    top: "0",
    width: `${CAPTURE_SHELL_WIDTH_PX}px`,
    boxSizing: "border-box",
    padding: "36px",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 18px 48px rgba(15, 23, 42, 0.07)",
  });

  shell.appendChild(content);
  document.body.appendChild(shell);

  removePdfDecorativeLucideIcons(shell);
  prepareDomSubtreeForHtml2Canvas(shell);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  try {
    const canvas = await html2canvas(shell, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      ignoreElements: (el) => el.tagName === "SCRIPT" || el.tagName === "STYLE",
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove());
        clonedDoc.querySelectorAll("style").forEach((el) => el.remove());
      },
    });
    return canvas;
  } finally {
    document.body.removeChild(shell);
  }
}

export interface ExportLabResultsPdfOptions {
  /** Appelé avant chaque capture html2canvas (1-based index). */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Export PDF multi-blocs : chaque segment est rendu sur une ou plusieurs pages entières sans être coupé au milieu.
 * Les graphiques Recharts sont capturés comme segments séparés pour éviter tout découpage horizontal entre pages.
 */
export async function exportLabResultsToPdf(options?: ExportLabResultsPdfOptions): Promise<void> {
  const segments = collectPdfSegments();
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const maxBodyHm = PDF_PAGE_H_MM - 2 * PDF_MARGIN_MM;
  let cursorYMm = PDF_MARGIN_MM;

  const total = segments.length;
  for (let i = 0; i < segments.length; i++) {
    options?.onProgress?.(i + 1, total);
    const segment = segments[i];
    const clone = segment.cloneNode(true) as HTMLElement;
    const canvas = await captureSegmentInShell(clone);

    let { wMm, hMm } = canvasSizeMm(canvas, PDF_CONTENT_W_MM);
    const fitted = scaleToFitPage(wMm, hMm, maxBodyHm);
    wMm = fitted.wMm;
    hMm = fitted.hMm;

    const spaceBelowMm = PDF_PAGE_H_MM - PDF_MARGIN_MM - cursorYMm;
    if (hMm > spaceBelowMm) {
      pdf.addPage();
      cursorYMm = PDF_MARGIN_MM;
    }

    const xMm = PDF_MARGIN_MM + (PDF_CONTENT_W_MM - wMm) / 2;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", xMm, cursorYMm, wMm, hMm);
    cursorYMm += hMm + PDF_GAP_MM;
  }

  pdf.save("Resultats_Medicaux.pdf");
}
