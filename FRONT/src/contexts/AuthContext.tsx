import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { apiPost, saveToken, clearToken } from "../lib/api";
import type { AuthUser } from "../types/auth";

const SESSION_KEY = "labia_auth_session";

function readSession(): AuthUser | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const { email, displayName, role } = parsed;
    if (typeof email !== "string" || typeof displayName !== "string" || typeof role !== "string") return null;
    if (role !== "userLabo" && role !== "labo") return null;
    return { email, displayName, role };
  } catch {
    return null;
  }
}

interface LoginApiResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<AuthUser | null>(() => readSession());

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user: apiUser } = await apiPost<LoginApiResponse>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      saveToken(token);
      setUser(apiUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(apiUser));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    clearToken();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
