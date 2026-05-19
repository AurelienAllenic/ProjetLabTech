import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";

vi.mock("../../lib/api", () => ({
  apiPost:    vi.fn(),
  saveToken:  vi.fn(),
  clearToken: vi.fn(),
}));

import { apiPost, saveToken, clearToken } from "../../lib/api";
const mockApiPost   = vi.mocked(apiPost);
const mockSaveToken = vi.mocked(saveToken);
const mockClearToken = vi.mocked(clearToken);

const MOCK_RESPONSE = {
  token: "test.jwt",
  user: { email: "user@demo.lab", displayName: "Jhon Doe", role: "userLabo" as const },
};

// ── Composants utilitaires ───────────────────────────────────────────────────

function UserDisplay() {
  const { user } = useAuth();
  return <div data-testid="user">{user ? user.email : "null"}</div>;
}

function LoginButton() {
  const { login } = useAuth();
  const [result, setResult] = useState<boolean | null>(null);
  return (
    <>
      <button onClick={async () => setResult(await login("user@demo.lab", "demo"))}>
        login
      </button>
      {result !== null && <span data-testid="result">{String(result)}</span>}
    </>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>logout</button>;
}

function renderProvider() {
  return render(
    <AuthProvider>
      <UserDisplay />
      <LoginButton />
      <LogoutButton />
    </AuthProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("AuthContext", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("starts with null user when no session exists", () => {
    renderProvider();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("restores the user from sessionStorage on mount", () => {
    sessionStorage.setItem(
      "labia_auth_session",
      JSON.stringify({ email: "user@demo.lab", displayName: "Jhon Doe", role: "userLabo" }),
    );
    renderProvider();
    expect(screen.getByTestId("user").textContent).toBe("user@demo.lab");
  });

  it("login() sets the user on success", async () => {
    mockApiPost.mockResolvedValue(MOCK_RESPONSE);
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("user@demo.lab");
    });
  });

  it("login() returns true on success", async () => {
    mockApiPost.mockResolvedValue(MOCK_RESPONSE);
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("true");
    });
  });

  it("login() calls saveToken with the received JWT", async () => {
    mockApiPost.mockResolvedValue(MOCK_RESPONSE);
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(mockSaveToken).toHaveBeenCalledWith("test.jwt");
    });
  });

  it("login() returns false and keeps user null when API rejects", async () => {
    mockApiPost.mockRejectedValue(new Error("Identifiants incorrects"));
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("result").textContent).toBe("false");
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("logout() clears the user and calls clearToken", async () => {
    mockApiPost.mockResolvedValue(MOCK_RESPONSE);
    renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "login" }));
    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("user@demo.lab"));

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(mockClearToken).toHaveBeenCalled();
  });
});
