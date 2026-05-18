import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Manual from "../../pages/Manual";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <Manual />
    </MemoryRouter>
  );

describe("Page Manual — intégration", () => {
  beforeEach(() => mockNavigate.mockClear());

  it("affiche le titre principal", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /construisez votre liste/i })).toBeInTheDocument();
  });

  it("navigue vers / au clic sur la croix", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /fermer/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("ajoute un test en cliquant sur un test courant", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ajouter le test hémoglobine/i }));
    // Après ajout, il existe un <span class="text-sm"> contenant "Hémoglobine" dans la liste
    const spans = screen.getAllByText("Hémoglobine");
    const inList = spans.find((el) => el.tagName === "SPAN" && el.className.includes("text-sm"));
    expect(inList).toBeDefined();
  });

  it("supprime un test ajouté", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ajouter le test glucose/i }));
    // Vérifie que le span dans la liste contient Glucose
    const listSpans = screen.getAllByText("Glucose");
    expect(listSpans.some((el) => el.tagName === "SPAN")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /supprimer le test glucose/i }));
    // Après suppression il ne reste que le bouton courant (dans common tests)
    const remaining = screen.getAllByText("Glucose");
    expect(remaining.every((el) => el.closest("button[aria-label*='Ajouter']") !== null)).toBe(true);
  });

  it("n'affiche pas le bouton Suivant si sexe ou âge manquent", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ajouter le test crp/i }));
    expect(screen.queryByRole("button", { name: /suivant/i })).toBeNull();
  });

  it("affiche le bouton Suivant quand test + sexe + âge sont renseignés", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ajouter le test crp/i }));
    fireEvent.click(screen.getByRole("radio", { name: /homme/i }));
    fireEvent.change(screen.getByLabelText(/âge/i), { target: { value: "30" } });
    expect(screen.getByRole("button", { name: /suivant/i })).toBeInTheDocument();
  });

  it("navigue vers /manual/values avec les bonnes données", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ajouter le test crp/i }));
    fireEvent.click(screen.getByRole("radio", { name: /homme/i }));
    fireEvent.change(screen.getByLabelText(/âge/i), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/manual/values",
      expect.objectContaining({ state: expect.objectContaining({ tests: ["CRP"], sex: "homme", age: 30 }) })
    );
  });
});
