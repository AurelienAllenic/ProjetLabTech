import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type * as ReactRouterDom from "react-router-dom";
import Login from "../../pages/Login";

const mockNavigate = vi.fn();
const mockLogin    = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: "/login" }),
  };
});

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, login: mockLogin, logout: vi.fn() }),
}));

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));
vi.mock("../../hooks/usePageTitle",        () => ({ usePageTitle:        () => undefined }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe("Page Login — intégration", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockReset();
  });

  it("affiche le formulaire de connexion", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /connexion professionnelle/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("affiche un lien retour vers l'accueil", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /retour au site public/i })).toBeInTheDocument();
  });

  it("affiche le message d'erreur quand login retourne false", async () => {
    mockLogin.mockResolvedValue(false);
    renderPage();

    fireEvent.change(screen.getByLabelText(/adresse e-mail/i), { target: { value: "bad@test.com" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),   { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("navigue vers /dashboard quand login retourne true", async () => {
    mockLogin.mockResolvedValue(true);
    renderPage();

    fireEvent.change(screen.getByLabelText(/adresse e-mail/i), { target: { value: "user@demo.lab" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),   { target: { value: "demo" } });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("appelle login avec l'email en minuscules et le mot de passe", async () => {
    mockLogin.mockResolvedValue(true);
    renderPage();

    fireEvent.change(screen.getByLabelText(/adresse e-mail/i), { target: { value: "USER@DEMO.LAB" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),   { target: { value: "demo" } });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("USER@DEMO.LAB", "demo");
    });
  });
});
