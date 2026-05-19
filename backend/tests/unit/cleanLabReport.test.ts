import { describe, it, expect } from "vitest";
import { cleanLabReport } from "../../servises/pdfToTextService.js";

describe("cleanLabReport", () => {
  it("returns empty string for empty input", () => {
    expect(cleanLabReport("")).toBe("");
  });

  it("returns empty string for falsy input", () => {
    // @ts-expect-error — test runtime guard
    expect(cleanLabReport(null)).toBe("");
  });

  it("replaces two or more dots with ==>", () => {
    expect(cleanLabReport("Glucose..........10")).toBe("Glucose==>10");
    expect(cleanLabReport("a..b")).toBe("a==>b");
  });

  it("does not replace a single dot", () => {
    expect(cleanLabReport("3.5")).toBe("3.5");
  });

  it("replaces two or more dashes with a newline", () => {
    expect(cleanLabReport("---")).toBe("\n ");
    expect(cleanLabReport("a---b")).toBe("a\n b");
  });

  it("replaces two or more underscores with a newline", () => {
    expect(cleanLabReport("___")).toBe("\n ");
  });

  it("does not replace a single dash", () => {
    expect(cleanLabReport("a-b")).toBe("a-b");
  });

  it("handles mixed separators independently", () => {
    const result = cleanLabReport("Hb......12---Glucose..5.2");
    expect(result).toContain("==>");
    expect(result).toContain("\n ");
  });
});
