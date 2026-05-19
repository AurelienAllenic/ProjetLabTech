import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiGet, apiPost, saveToken, clearToken } from "../../lib/api";

type FetchCall = [string, RequestInit];

describe("api client", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // ── saveToken / clearToken ────────────────────────────────────────────────

  describe("saveToken", () => {
    it("stores the token in sessionStorage", () => {
      saveToken("my.jwt");
      expect(sessionStorage.getItem("labia_jwt")).toBe("my.jwt");
    });
  });

  describe("clearToken", () => {
    it("removes the token from sessionStorage", () => {
      sessionStorage.setItem("labia_jwt", "my.jwt");
      clearToken();
      expect(sessionStorage.getItem("labia_jwt")).toBeNull();
    });
  });

  // ── apiGet ────────────────────────────────────────────────────────────────

  describe("apiGet", () => {
    it("adds Authorization header when a token is stored", async () => {
      saveToken("tok.en");
      const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal("fetch", fetchFn);

      await apiGet("/test");

      const [, opts] = fetchFn.mock.calls[0] as FetchCall;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer tok.en");
    });

    it("does not add Authorization header when no token", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal("fetch", fetchFn);

      await apiGet("/test");

      const [, opts] = fetchFn.mock.calls[0] as FetchCall;
      expect((opts.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it("calls the correct URL", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal("fetch", fetchFn);

      await apiGet("/users");

      const [url] = fetchFn.mock.calls[0] as FetchCall;
      expect(url).toContain("/users");
    });

    it("throws with the server error message when response is not ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found",
        json: async () => ({ error: "Resource not found" }),
      }));

      await expect(apiGet("/missing")).rejects.toThrow("Resource not found");
    });

    it("falls back to statusText when the error body has no message", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
        json: async () => ({}),
      }));

      await expect(apiGet("/error")).rejects.toThrow("Internal Server Error");
    });

    it("returns the parsed JSON body on success", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      }));

      const result = await apiGet<{ users: unknown[] }>("/users");
      expect(result).toEqual({ users: [] });
    });
  });

  // ── apiPost ───────────────────────────────────────────────────────────────

  describe("apiPost", () => {
    it("sends a POST request with a JSON body", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal("fetch", fetchFn);

      await apiPost("/auth/login", { email: "a@b.com", password: "demo" });

      const [url, opts] = fetchFn.mock.calls[0] as FetchCall;
      expect(url).toContain("/auth/login");
      expect(opts.method).toBe("POST");
      expect(opts.body).toBe(JSON.stringify({ email: "a@b.com", password: "demo" }));
    });

    it("sets Content-Type to application/json", async () => {
      const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal("fetch", fetchFn);

      await apiPost("/auth/login", {});

      const [, opts] = fetchFn.mock.calls[0] as FetchCall;
      expect((opts.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    });

    it("throws with the server error message when response is not ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
        json: async () => ({ error: "Identifiants incorrects" }),
      }));

      await expect(apiPost("/auth/login", {})).rejects.toThrow("Identifiants incorrects");
    });
  });
});
