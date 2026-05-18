import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type * as ReactRouterDom from "react-router-dom";
import LabResultsPage from "../../pages/LabResultsPage";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));

const MOCK_RESULT = {
  success: true,
  result: {
    elements: [
      { nom: "Hémoglobine", taux: "14 g/dL", categorie: "normal",   explication: "Taux normal." },
      { nom: "Glucose",     taux: "6 mmol/L", categorie: "abnormal", explication: "Légèrement élevé." },
    ],
  },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <LabResultsPage />
    </MemoryRouter>
  );

describe("Page LabResultsPage — intégration", () => {
  beforeEach(() => localStorage.clear());

  it("affiche 'Aucun résultat' si localStorage est vide", () => {
    renderPage();
    expect(screen.getByText(/aucun résultat détecté/i)).toBeInTheDocument();
  });

  it("affiche les résultats depuis localStorage", () => {
    localStorage.setItem("analysisResult", JSON.stringify(MOCK_RESULT));
    renderPage();
    expect(screen.getByText("Hémoglobine")).toBeInTheDocument();
    expect(screen.getByText("Glucose")).toBeInTheDocument();
  });

  it("affiche la bannière des valeurs normales", () => {
    localStorage.setItem("analysisResult", JSON.stringify(MOCK_RESULT));
    renderPage();
    expect(screen.getByText(/1 valeur.*normale/i)).toBeInTheDocument();
  });

  it("affiche la bannière des valeurs à surveiller", () => {
    localStorage.setItem("analysisResult", JSON.stringify(MOCK_RESULT));
    renderPage();
    expect(screen.getByText(/1 valeur.*surveiller/i)).toBeInTheDocument();
  });

  it("affiche les explications des résultats", () => {
    localStorage.setItem("analysisResult", JSON.stringify(MOCK_RESULT));
    renderPage();
    expect(screen.getByText("Taux normal.")).toBeInTheDocument();
    expect(screen.getByText("Légèrement élevé.")).toBeInTheDocument();
  });

  it("affiche le bouton Export PDF", () => {
    localStorage.setItem("analysisResult", JSON.stringify(MOCK_RESULT));
    renderPage();
    expect(screen.getByRole("button", { name: /export.*pdf/i })).toBeInTheDocument();
  });
});
