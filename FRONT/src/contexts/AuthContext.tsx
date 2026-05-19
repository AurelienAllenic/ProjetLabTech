import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import authUsersData from "../mocks/auth-users.json";
import type { AuthUser, AuthUserRecord } from "../types/auth";
import { isLabRole } from "../types/auth";

const SESSION_STORAGE_KEY = "labia_auth_session";

function parseAuthRecords(data: unknown): AuthUserRecord[] {
  if (!Array.isArray(data)) return [];
  const out: AuthUserRecord[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const email = o.email;
    const password = o.password;
    const displayName = o.displayName;
    const role = o.role;
    if (
      typeof email === "string" &&
      typeof password === "string" &&
      typeof displayName === "string" &&
      typeof role === "string" &&
      isLabRole(role)
    ) {
      out.push({ email, password, displayName, role });
    }
  }
  return out;
}

const MOCK_USERS: AuthUserRecord[] = parseAuthRecords(authUsersData);

function readSession(): AuthUser | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const email = parsed.email;
    const displayName = parsed.displayName;
    const role = parsed.role;
    if (
      typeof email !== "string" ||
      typeof displayName !== "string" ||
      typeof role !== "string" ||
      !isLabRole(role)
    ) {
      return null;
    }
    return { email, displayName, role };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(() => readSession());

  const login = useCallback((email: string, password: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    const record = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === trimmed && u.password === password,
    );
    if (!record) return false;
    const next: AuthUser = {
      email: record.email,
      displayName: record.displayName,
      role: record.role,
    };
    setUser(next);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}
