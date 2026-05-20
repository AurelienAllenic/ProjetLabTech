import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type * as ReactRouterDom from "react-router-dom";
import Manual from "../../pages/Manual";
import { wrapWithRouterAndAuth } from "../authTestUtils";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));

const renderPage = () => render(wrapWithRouterAndAuth(<Manual />));

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
    const spans = screen.getAllByText("Hémoglobine");
    const inList = spans.find((el) => el.tagName === "SPAN" && el.className.includes("text-sm"));
    expect(inList).toBeDefined();
  });

  it("n'ajoute pas deux fois le même test (boutons courants)", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ajouter le test glucose/i }));
    const list = screen.getByRole("list", { name: /liste des tests sélectionnés/i });
    expect(list.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /glucose.*déjà dans la liste/i })).toBeDisabled();
  });

  it("n'ajoute pas deux fois le même test (saisie libre, insensible à la casse)", () => {
    renderPage();
    const input = screen.getByLabelText(/nom du test à ajouter/i);
    const form = input.closest("form");
    expect(form).toBeInstanceOf(HTMLFormElement);
    const htmlForm = form as HTMLFormElement;
    fireEvent.change(input, { target: { value: "CRP" } });
    fireEvent.submit(htmlForm);
    fireEvent.change(input, { target: { value: "crp" } });
    fireEvent.submit(htmlForm);
    const list = screen.getByRole("list", { name: /liste des tests sélectionnés/i });
    expect(list.querySelectorAll("li")).toHaveLength(1);
  });

  it("supprime un test ajouté", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ajouter le test glucose/i }));
    const listSpans = screen.getAllByText("Glucose");
    expect(listSpans.some((el) => el.tagName === "SPAN")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /supprimer le test glucose/i }));
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
