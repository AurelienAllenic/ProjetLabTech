import { extractPdfText, cleanLabReport } from "../servises/pdfToTextService.js";
import { generateTextFromPdf, generateTextFromImage } from "../servises/callMistralService.js";
export function extractJsonSafe(text) {
    if (!text)
        return null;
    try {
        let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const start = clean.indexOf("{");
        const end = clean.lastIndexOf("}");
        if (start === -1 || end === -1)
            return null;
        clean = clean.slice(start, end + 1);
        clean = clean.replace(/,\s*}/g, "}");
        clean = clean.replace(/,\s*]/g, "]");
        clean = clean.replace(/[ –—]/g, " ");
        return JSON.parse(clean);
    }
    catch {
        console.error("JSON PARSE FAILED (analyse IA)");
        return null;
    }
}
function extractConclusion(parsed) {
    if (!parsed || Array.isArray(parsed))
        return undefined;
    if (typeof parsed !== "object")
        return undefined;
    const raw = parsed.conclusion;
    if (typeof raw !== "string")
        return undefined;
    const t = raw.trim();
    return t.length > 0 ? t : undefined;
}
export async function analysePdf(req, res) {
    try {
        if (!req.file) {
            res.status(400).json({ error: "PDF manquant" });
            return;
        }
        let aiResponse;
        if (req.originalImageBuffer && req.originalImageMimeType) {
            console.log("🖼️ Image détectée — analyse vision directe");
            const base64 = req.originalImageBuffer.toString("base64");
            aiResponse = await generateTextFromImage(base64, req.originalImageMimeType);
        }
        else {
            const rawText = await extractPdfText(req.file.buffer);
            const cleanedText = cleanLabReport(rawText);
            const safeText = cleanedText.slice(0, 5000);
            console.log("PDF LENGTH:", cleanedText.length);
            console.log("SENT TO IA:", safeText.length);
            aiResponse = await generateTextFromPdf(safeText);
        }
        console.log("IA response received");
        const parsed = extractJsonSafe(aiResponse);
        if (!parsed) {
            console.warn("JSON IA invalid — fallback");
            res.json({
                success: true,
                result: {
                    elements: [],
                    warning: "Analyse partielle : certains résultats n'ont pas pu être interprétés automatiquement.",
                },
            });
            return;
        }
        let elements = [];
        if (Array.isArray(parsed)) {
            elements = parsed.slice(0, 8);
        }
        else if ("elements" in parsed && Array.isArray(parsed.elements)) {
            elements = parsed.elements.slice(0, 8);
        }
        else {
            elements = [parsed];
        }
        const conclusion = extractConclusion(parsed);
        const result = { elements };
        if (conclusion) {
            result.conclusion = conclusion;
        }
        res.json({ success: true, result });
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("ANALYSE ERROR:", error);
        res.status(500).json({ error: "Erreur pendant l'analyse", details: error.message });
    }
}
