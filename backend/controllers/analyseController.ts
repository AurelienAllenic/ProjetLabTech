import type { Request, Response } from "express";
import { extractPdfText, cleanLabReport } from "../services/pdfTextService.js";
import { generateTextFromImage, generateTextFromPdf } from "../services/mistralService.js";
import type { ApiElement, AnalysisResult } from "../types.js";

type ParsedJson =
  | { elements?: ApiElement[]; conclusion?: string }
  | ApiElement[]
  | ApiElement;

export function extractJsonSafe(text: string | null | undefined): ParsedJson | null {
  if (!text) return null;

  try {
    let clean = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const objectStart = clean.indexOf("{");
    const objectEnd = clean.lastIndexOf("}");
    const arrayStart = clean.indexOf("[");
    const arrayEnd = clean.lastIndexOf("]");

    if (objectStart === -1 && arrayStart === -1) return null;

    const useArray =
      arrayStart !== -1 &&
      arrayEnd !== -1 &&
      (objectStart === -1 || arrayStart < objectStart);

    clean = useArray
      ? clean.slice(arrayStart, arrayEnd + 1)
      : clean.slice(objectStart, objectEnd + 1);

    clean = clean.replace(/,\s*}/g, "}");
    clean = clean.replace(/,\s*]/g, "]");
    clean = clean.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");

    const parsed = JSON.parse(clean) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.every((item) => item && typeof item === "object" && !Array.isArray(item))
        ? (parsed as ApiElement[])
        : null;
    }

    return parsed && typeof parsed === "object" ? (parsed as ParsedJson) : null;
  } catch {
    console.error("JSON parse failed");
    return null;
  }
}

function normalizeParsedAnalysis(parsed: ParsedJson): AnalysisResult["result"] {
  if (Array.isArray(parsed)) {
    return { elements: parsed.slice(0, 8) };
  }

  if ("elements" in parsed && Array.isArray(parsed.elements)) {
    return {
      elements: parsed.elements.slice(0, 8),
      ...(typeof parsed.conclusion === "string" && parsed.conclusion.trim()
        ? { conclusion: parsed.conclusion.trim() }
        : {}),
    };
  }

  return { elements: [parsed as ApiElement] };
}

export async function analysePdf(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: "PDF ou image manquant" });
      return;
    }

    let aiResponse: string;

    if (req.originalImageBuffer && req.originalImageMimeType) {
      aiResponse = await generateTextFromImage(
        req.originalImageBuffer.toString("base64"),
        req.originalImageMimeType,
      );
    } else {
      const rawText = await extractPdfText(req.file.buffer);
      const cleanedText = cleanLabReport(rawText);
      const safeText = cleanedText.slice(0, 5000);

      console.log("PDF text length:", cleanedText.length);
      console.log("Sent to AI length:", safeText.length);

      aiResponse = await generateTextFromPdf(safeText);
    }

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

    res.json({
      success: true,
      result: normalizeParsedAnalysis(parsed),
    } satisfies AnalysisResult);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("ANALYSE ERROR:", error);
    res.status(500).json({ error: "Erreur pendant l'analyse", details: error.message });
  }
}
