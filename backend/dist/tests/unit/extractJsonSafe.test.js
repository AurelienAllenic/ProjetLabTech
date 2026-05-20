import { describe, it, expect } from "vitest";
import { extractJsonSafe } from "../../controllers/anlyseController.js";
describe("extractJsonSafe", () => {
    it("returns null for null input", () => {
        expect(extractJsonSafe(null)).toBeNull();
    });
    it("returns null for empty string", () => {
        expect(extractJsonSafe("")).toBeNull();
    });
    it("parses a plain JSON object", () => {
        expect(extractJsonSafe('{"elements": []}')).toEqual({ elements: [] });
    });
    it("strips ```json markdown fences", () => {
        const input = '```json\n{"elements": []}\n```';
        expect(extractJsonSafe(input)).toEqual({ elements: [] });
    });
    it("strips plain ``` fences", () => {
        const input = '```\n{"a": 1}\n```';
        expect(extractJsonSafe(input)).toEqual({ a: 1 });
    });
    it("fixes trailing commas in objects", () => {
        const result = extractJsonSafe('{"nom": "Glucose","taux": "5.2",}');
        expect(result).toEqual({ nom: "Glucose", taux: "5.2" });
    });
    it("fixes trailing commas in arrays", () => {
        const result = extractJsonSafe('{"elements": [{"nom": "x"},]}');
        expect(result).toEqual({ elements: [{ nom: "x" }] });
    });
    it("extracts JSON when surrounded by extra text", () => {
        const result = extractJsonSafe('Voici le résultat : {"elements": []} fin.');
        expect(result).toEqual({ elements: [] });
    });
    it("returns null when no braces are found (bare array)", () => {
        expect(extractJsonSafe("[1, 2, 3]")).toBeNull();
    });
    it("returns null for completely invalid JSON", () => {
        expect(extractJsonSafe("not json at all")).toBeNull();
    });
    it("parses a full elements response", () => {
        const input = JSON.stringify({
            elements: [
                { nom: "Glucose", taux: "5.2", categorie: "correct", explication: "ok" },
            ],
        });
        const result = extractJsonSafe(input);
        expect(result.elements).toHaveLength(1);
    });
});
