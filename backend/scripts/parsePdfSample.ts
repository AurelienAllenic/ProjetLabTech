import { fileURLToPath } from "node:url";
import { cleanLabReport, extractPdfText } from "../services/pdfTextService.js";

async function parsePdfSample() {
  const pdfPath = fileURLToPath(
    new URL("../comptes-rendus/examin.pdf", import.meta.url)
  );
  const text = await extractPdfText(pdfPath);
  const cleaned = cleanLabReport(text);

  console.log(cleaned);
}

void parsePdfSample();
