import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type * as ReactRouterDom from "react-router-dom";
import Upload from "../../pages/Upload";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <Upload />
    </MemoryRouter>
  );

describe("Page Upload — intégration", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.restoreAllMocks();
  });

  it("affiche le titre de la page", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /téléversez votre rapport/i })).toBeInTheDocument();
  });

  it("affiche la carte d'upload avec le bon label", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /téléverser un fichier/i })).toBeInTheDocument();
  });

  it("navigue vers / au clic sur la croix", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /fermer/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("affiche le bouton Analyser après sélection d'un fichier", async () => {
    renderPage();
    const input = document.querySelector<HTMLInputElement>("#file-upload");
    if (!input) throw new Error("Input #file-upload introuvable");
    const file = new File(["contenu"], "rapport.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /analyser ce rapport/i })).toBeInTheDocument();
    });
  });

  it("affiche le bouton Supprimer après sélection d'un fichier", async () => {
    renderPage();
    const input = document.querySelector<HTMLInputElement>("#file-upload");
    if (!input) throw new Error("Input #file-upload introuvable");
    const file = new File(["contenu"], "rapport.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /supprimer le fichier/i })).toBeInTheDocument();
    });
  });

  it("supprime le fichier et masque le bouton Analyser", async () => {
    renderPage();
    const input = document.querySelector<HTMLInputElement>("#file-upload");
    if (!input) throw new Error("Input #file-upload introuvable");
    const file = new File(["contenu"], "rapport.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /supprimer/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /supprimer/i }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /analyser ce rapport/i })).toBeNull();
    });
  });

  it("envoie le fichier à l'API et navigue vers /results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, result: { elements: [] } }),
      })
    );

    renderPage();
    const input = document.querySelector<HTMLInputElement>("#file-upload");
    if (!input) throw new Error("Input #file-upload introuvable");
    const file = new File(["contenu"], "rapport.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /analyser ce rapport/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /analyser ce rapport/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/results");
    });
  });

  it("affiche une alerte si l'API échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, text: async () => "Erreur serveur" })
    );
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);

    renderPage();
    const input = document.querySelector<HTMLInputElement>("#file-upload");
    if (!input) throw new Error("Input #file-upload introuvable");
    fireEvent.change(input, { target: { files: [new File(["x"], "x.pdf", { type: "application/pdf" })] } });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /analyser ce rapport/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /analyser ce rapport/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
  });
});
