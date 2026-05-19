import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LaboDashboard from "../../pages/dashboard/LaboDashboard";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockApiGet  = vi.fn();
const mockApiPost = vi.fn();

vi.mock("../../lib/api", () => ({
  apiGet:     (...args: unknown[]) => mockApiGet(...args),
  apiPost:    (...args: unknown[]) => mockApiPost(...args),
  saveToken:  vi.fn(),
  clearToken: vi.fn(),
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "labo@demo.lab", displayName: "Admin Labo", role: "labo" },
    logout: vi.fn(),
  }),
}));

vi.mock("../../hooks/useScrollAnimations", () => ({ useScrollAnimations: () => undefined }));
vi.mock("../../hooks/usePageTitle",        () => ({ usePageTitle:        () => undefined }));

// ── Données de test ──────────────────────────────────────────────────────────

const MOCK_USER = {
  id: "u-1", email: "alice@test.com", display_name: "Alice Martin",
  role: "userLabo", created_at: "2026-01-15T10:00:00Z",
};

const MOCK_ASSIGNMENT = {
  id: "a-1", document_id: "doc-guide-prelevement",
  document_title: "Guide prélèvement sanguin",
  assigned_at: "2026-01-15T11:00:00Z",
  users: { email: "alice@test.com", display_name: "Alice Martin" },
};

function defaultApiGet(path: string) {
  if (path === "/users")       return Promise.resolve({ users: [] });
  if (path === "/assignments") return Promise.resolve({ assignments: [] });
  return Promise.resolve({});
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <LaboDashboard />
    </MemoryRouter>
  );

// ── Tests ────────────────────────────────────────────────────────────────────

describe("LaboDashboard — intégration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation(defaultApiGet);
  });

  it("affiche le nom du gestionnaire connecté", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/admin labo/i)).toBeInTheDocument();
    });
  });

  it("affiche 'Aucun compte' quand la liste est vide", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/aucun compte pour le moment/i)).toBeInTheDocument();
    });
  });

  it("affiche les comptes chargés depuis l'API dans le tableau", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/users")       return Promise.resolve({ users: [MOCK_USER] });
      if (path === "/assignments") return Promise.resolve({ assignments: [] });
      return Promise.resolve({});
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Alice Martin")).toBeInTheDocument();
      expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    });
  });

  it("affiche les attributions chargées depuis l'API dans le tableau", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/users")       return Promise.resolve({ users: [MOCK_USER] });
      if (path === "/assignments") return Promise.resolve({ assignments: [MOCK_ASSIGNMENT] });
      return Promise.resolve({});
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Guide prélèvement sanguin")).toBeInTheDocument();
    });
  });

  it("le bouton Attribuer est désactivé quand il n'y a aucun compte", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /attribuer/i })).toBeDisabled();
    });
  });

  it("crée un compte et l'ajoute dans le tableau", async () => {
    mockApiPost.mockResolvedValue({ user: MOCK_USER });
    renderPage();

    fireEvent.change(screen.getByLabelText(/e-mail/i),      { target: { value: "alice@test.com" } });
    fireEvent.change(screen.getByLabelText(/nom affiché/i), { target: { value: "Alice Martin" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),{ target: { value: "motdepasse" } });
    fireEvent.click(screen.getByRole("button", { name: /créer le compte/i }));

    await waitFor(() => {
      expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({ email: "alice@test.com", displayName: "Alice Martin" }),
    );
  });

  it("affiche un message de succès après la création du compte", async () => {
    mockApiPost.mockResolvedValue({ user: MOCK_USER });
    renderPage();

    fireEvent.change(screen.getByLabelText(/e-mail/i),      { target: { value: "alice@test.com" } });
    fireEvent.change(screen.getByLabelText(/nom affiché/i), { target: { value: "Alice Martin" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),{ target: { value: "motdepasse" } });
    fireEvent.click(screen.getByRole("button", { name: /créer le compte/i }));

    await waitFor(() => {
      expect(screen.getByText(/créé avec succès/i)).toBeInTheDocument();
    });
  });

  it("affiche un message d'erreur quand la création de compte échoue", async () => {
    mockApiPost.mockRejectedValue(new Error("Un compte avec cet e-mail existe déjà"));
    renderPage();

    fireEvent.change(screen.getByLabelText(/e-mail/i),      { target: { value: "alice@test.com" } });
    fireEvent.change(screen.getByLabelText(/nom affiché/i), { target: { value: "Alice Martin" } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i),{ target: { value: "motdepasse" } });
    fireEvent.click(screen.getByRole("button", { name: /créer le compte/i }));

    await waitFor(() => {
      expect(screen.getByText(/un compte avec cet e-mail existe déjà/i)).toBeInTheDocument();
    });
  });

  it("attribue un document et affiche un message de succès", async () => {
    mockApiGet.mockImplementation((path: string) => {
      if (path === "/users")       return Promise.resolve({ users: [MOCK_USER] });
      if (path === "/assignments") return Promise.resolve({ assignments: [] });
      return Promise.resolve({});
    });
    mockApiPost.mockResolvedValue({ assignment: MOCK_ASSIGNMENT });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /attribuer/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /attribuer/i }));

    await waitFor(() => {
      expect(screen.getByText(/attribué à/i)).toBeInTheDocument();
    });
    expect(mockApiPost).toHaveBeenCalledWith(
      "/assignments",
      expect.objectContaining({ assignedToEmail: "alice@test.com" }),
    );
  });
});
