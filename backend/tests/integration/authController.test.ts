import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { signInWithPasswordMock, getOrCreateUserMock } = vi.hoisted(() => ({
  signInWithPasswordMock: vi.fn(),
  getOrCreateUserMock: vi.fn(),
}));

vi.mock("../../lib/supabase.js", () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  },
}));

vi.mock("../../services/usersService.js", () => ({
  getOrCreateUser: getOrCreateUserMock,
}));

import { login, me } from "../../controllers/authController.js";

function makeReqRes(body: Record<string, unknown> = {}, user?: Record<string, unknown>) {
  const req = { body, user } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  return { req, res };
}

describe("login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const { req, res } = makeReqRes({ password: "demo" });
    await login(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 400 when password is missing", async () => {
    const { req, res } = makeReqRes({ email: "user@demo.lab" });
    await login(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 401 when Supabase Auth rejects credentials", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "invalid" },
    });

    const { req, res } = makeReqRes({ email: "unknown@test.com", password: "demo" });
    await login(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
  });

  it("returns Supabase tokens and app user on success", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
        user: {
          id: "uid-1",
          email: "user@demo.lab",
        },
      },
      error: null,
    });
    getOrCreateUserMock.mockResolvedValue({
      id: "uid-1",
      email: "user@demo.lab",
      displayName: "User Demo",
      role: "client",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const { req, res } = makeReqRes({ email: "user@demo.lab", password: "demo" });
    await login(req, res);

    expect(vi.mocked(res.json)).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: expect.objectContaining({
          id: "uid-1",
          email: "user@demo.lab",
          displayName: "User Demo",
          role: "userLabo",
        }),
      }),
    );
  });
});

describe("me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when req.user is missing", async () => {
    const { req, res } = makeReqRes();
    await me(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
  });

  it("returns the authenticated user", async () => {
    const user = {
      id: "uid-1",
      email: "user@demo.lab",
      displayName: "User Demo",
      role: "client",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const { req, res } = makeReqRes({}, user);
    await me(req, res);

    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: "userLabo",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });
  });
});
