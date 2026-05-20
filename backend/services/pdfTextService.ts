import { extractText, getDocumentProxy } from "unpdf";
import fs from "fs/promises";

/** Aligné avec la version pdfjs utilisée par unpdf (~5.4.x), évite l’avertissement standardFontDataUrl. */
const STANDARD_FONT_DATA_URL =
  process.env.PDF_STANDARD_FONT_DATA_URL ??
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/standard_fonts/";

export async function extractPdfText(input: Buffer | string): Promise<string> {
  let buffer: Buffer;

  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (typeof input === "string") {
    buffer = await fs.readFile(input);
  } else {
    throw new Error("Entrée invalide : Buffer ou chemin attendu");
  }

  const pdf = await getDocumentProxy(new Uint8Array(buffer), {
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  });
  const { text } = await extractText(pdf, { mergePages: true });

  return text;
}

export function cleanLabReport(text: string): string {
  if (!text) return "";

  let cleaned = text;
  cleaned = cleaned.replace(/[.]{2,}/g, "==>");
  cleaned = cleaned.replace(/[_-]{2,}/g, "\n ");

  return cleaned;
}
