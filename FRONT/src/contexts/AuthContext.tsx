import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "../types/auth";
import { isLabRole } from "../types/auth";

const SESSION_KEY = "labia_auth_session";
const TOKEN_KEY = "labia_auth_token";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function readSession(): AuthUser | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const { email, displayName, role } = parsed;
    if (
      typeof email !== "string" ||
      typeof displayName !== "string" ||
      typeof role !== "string" ||
      !isLabRole(role)
    )
      return null;
    return { email, displayName, role };
  } catch {
    return null;
  }
}

interface LoginApiResponse {
  token?: string;
  user?: { email: string; displayName: string; role: string };
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(() => readSession());
  const [token, setToken] = useState<string | null>(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null),
  );

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as LoginApiResponse;

    if (!res.ok) {
      throw new Error(data.error ?? "Identifiants incorrects");
    }

    if (!data.token || !data.user || !isLabRole(data.user.role)) {
      throw new Error("Réponse du serveur invalide");
    }

    const next: AuthUser = {
      email: data.user.email,
      displayName: data.user.displayName,
      role: data.user.role,
    };

    setUser(next);
    setToken(data.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    localStorage.setItem(TOKEN_KEY, data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, login, logout }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
