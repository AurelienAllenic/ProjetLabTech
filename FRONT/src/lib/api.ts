const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const JWT_KEY = "labia_jwt";

export function saveToken(token: string): void {
  sessionStorage.setItem(JWT_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(JWT_KEY);
}

function getToken(): string | null {
  return sessionStorage.getItem(JWT_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** POST multipart ; ne pas définir Content-Type (boundary généré par le navigateur). */
export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}
