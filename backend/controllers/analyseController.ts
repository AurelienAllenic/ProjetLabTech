import type { Request, Response } from "express";
import { extractPdfText, cleanLabReport } from "../services/pdfTextService.js";
import { generateTextFromPdf } from "../services/mistralService.js";
import type { ApiElement, AnalysisResult } from "../types.js";

type ParsedJson =
  | { elements?: ApiElement[] }
  | ApiElement[]
  | ApiElement;

export function extractJsonSafe(text: string | null | undefined): ParsedJson | null {
  if (!text) return null;

  try {
    let clean = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");

    if (start === -1 || end === -1) return null;

    clean = clean.slice(start, end + 1);
    clean = clean.replace(/,\s*}/g, "}");
    clean = clean.replace(/,\s*]/g, "]");
    clean = clean.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");

    return JSON.parse(clean) as ParsedJson;
  } catch {
    console.error("JSON parse failed");
    return null;
  }
}

export async function analysePdf(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: "PDF manquant" });
      return;
    }

    const rawText = await extractPdfText(req.file.buffer);
    const cleanedText = cleanLabReport(rawText);
    const safeText = cleanedText.slice(0, 5000);

    console.log("PDF text length:", cleanedText.length);
    console.log("Sent to AI length:", safeText.length);

    const aiResponse = await generateTextFromPdf(safeText);
    console.log("AI response received");

    const parsed = extractJsonSafe(aiResponse);

    if (!parsed) {
      console.warn("Invalid AI JSON response. Fallback enabled.");
      res.json({
        success: true,
        result: {
          elements: [],
          warning:
            "Analyse partielle : certains résultats n'ont pas pu être interprétés automatiquement.",
        },
      } satisfies AnalysisResult);
      return;
    }

    let elements: ApiElement[] = [];

    if (Array.isArray(parsed)) {
      elements = parsed.slice(0, 8);
    } else if ("elements" in parsed && Array.isArray(parsed.elements)) {
      elements = parsed.elements.slice(0, 8);
    } else {
      elements = [parsed as ApiElement];
    }

    res.json({ success: true, result: { elements } } satisfies AnalysisResult);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("ANALYSE ERROR:", error);
    res.status(500).json({ error: "Erreur pendant l'analyse", details: error.message });
  }
}
