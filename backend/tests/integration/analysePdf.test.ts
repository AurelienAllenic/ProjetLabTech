import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("../../services/pdfTextService.js", () => ({
  extractPdfText: vi.fn(),
  cleanLabReport: vi.fn((text: string) => text),
}));

vi.mock("../../services/mistralService.js", () => ({
  generateTextFromPdf: vi.fn(),
  generateTextFromImage: vi.fn(),
}));

import { extractPdfText } from "../../services/pdfTextService.js";
import { generateTextFromPdf } from "../../services/mistralService.js";
import { analysePdf } from "../../controllers/analyseController.js";

const mockExtractPdfText = vi.mocked(extractPdfText);
const mockGenerateTextFromPdf = vi.mocked(generateTextFromPdf);

function makeReqRes(hasFile = true) {
  const req = {
    file: hasFile ? { buffer: Buffer.from("fake-pdf") } : undefined,
  } as Request;

  const res = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

describe("analysePdf controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no file is attached", async () => {
    const { req, res } = makeReqRes(false);
    await analysePdf(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({ error: "PDF ou image manquant" });
  });

  it("returns parsed elements on a valid AI response", async () => {
    const elements = [{ nom: "Glucose", taux: "5.2", categorie: "correct", explication: "ok" }];
    mockExtractPdfText.mockResolvedValue("raw text");
    mockGenerateTextFromPdf.mockResolvedValue(JSON.stringify({ elements }));

    const { req, res } = makeReqRes();
    await analysePdf(req, res);

    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      success: true,
      result: { elements },
    });
  });

  it("returns fallback when AI response is not valid JSON", async () => {
    mockExtractPdfText.mockResolvedValue("raw text");
    mockGenerateTextFromPdf.mockResolvedValue("désolé je ne comprends pas");

    const { req, res } = makeReqRes();
    await analysePdf(req, res);

    expect(vi.mocked(res.json)).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({ elements: [] }),
      })
    );
  });

  it("caps elements at 8 when AI returns more", async () => {
    const elements = Array.from({ length: 12 }, (_, i) => ({ nom: `Test${i}` }));
    mockExtractPdfText.mockResolvedValue("raw text");
    mockGenerateTextFromPdf.mockResolvedValue(JSON.stringify({ elements }));

    const { req, res } = makeReqRes();
    await analysePdf(req, res);

    const call = vi.mocked(res.json).mock.calls[0][0] as { result: { elements: unknown[] } };
    expect(call.result.elements).toHaveLength(8);
  });

  it("handles an AI response shaped as a direct array", async () => {
    const element = { nom: "Hémoglobine", taux: "13", categorie: "correct", explication: "" };
    mockExtractPdfText.mockResolvedValue("raw text");
    mockGenerateTextFromPdf.mockResolvedValue(JSON.stringify([element]));

    const { req, res } = makeReqRes();
    await analysePdf(req, res);

    // extractJsonSafe finds the first `{` inside the array and parses that single object,
    // which the controller then wraps in a one-element array
    const call = vi.mocked(res.json).mock.calls[0][0] as { result: { elements: unknown[] } };
    expect(call.result.elements).toHaveLength(1);
  });

  it("returns 500 when PDF extraction throws", async () => {
    mockExtractPdfText.mockRejectedValue(new Error("lecture impossible"));

    const { req, res } = makeReqRes();
    await analysePdf(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(500);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Erreur pendant l'analyse" })
    );
  });
});
