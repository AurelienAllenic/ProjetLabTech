import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserLaboDashboard from "../../pages/dashboard/UserLaboDashboard";

const mockLogout = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "user@demo.lab", displayName: "Jhon Doe", role: "userLabo" },
    logout: mockLogout,
  }),
}));

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));
vi.mock("../../hooks/usePageTitle",        () => ({ usePageTitle:        () => undefined }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <UserLaboDashboard />
    </MemoryRouter>
  );

describe("UserLaboDashboard — intégration", () => {
  it("affiche le nom de l'utilisateur connecté", () => {
    renderPage();
    expect(screen.getByText(/jhon doe/i)).toBeInTheDocument();
  });

  it("affiche l'email de l'utilisateur connecté", () => {
    renderPage();
    expect(screen.getByText("user@demo.lab")).toBeInTheDocument();
  });

  it("affiche la carte Téléverser un fichier", () => {
    renderPage();
    expect(screen.getByText(/téléverser un fichier/i)).toBeInTheDocument();
  });

  it("affiche la carte Analyser (saisie manuelle)", () => {
    renderPage();
    expect(screen.getByText(/saisie manuelle/i)).toBeInTheDocument();
  });

  it("affiche le bouton de déconnexion dans l’en-tête", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it("appelle logout au clic sur Déconnexion (nav)", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /se déconnecter/i }));
    expect(mockLogout).toHaveBeenCalled();
  });

  it("le lien Téléverser pointe vers /upload", () => {
    renderPage();
    const uploadLink = screen.getByRole("link", { name: /téléverser un fichier/i });
    expect(uploadLink).toHaveAttribute("href", "/upload");
  });

  it("le lien Saisie manuelle pointe vers /manual", () => {
    renderPage();
    const manualLink = screen.getByRole("link", { name: /saisie manuelle/i });
    expect(manualLink).toHaveAttribute("href", "/manual");
  });
});
