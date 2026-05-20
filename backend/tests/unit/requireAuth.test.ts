import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { getUserMock, getOrCreateUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  getOrCreateUserMock: vi.fn(),
}));

vi.mock("../../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
  },
}));

vi.mock("../../services/usersService.js", () => ({
  getOrCreateUser: getOrCreateUserMock,
}));

import { requireAuth } from "../../middlewares/requireAuth.js";

function makeArgs(authHeader?: string) {
  const req = { headers: { authorization: authHeader } } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("requireAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when Authorization header is absent", async () => {
    const { req, res, next } = makeArgs();
    await requireAuth(req, res, next);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header does not start with Bearer", async () => {
    const { req, res, next } = makeArgs("Basic abc123");
    await requireAuth(req, res, next);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid" },
    });

    const { req, res, next } = makeArgs("Bearer bad.token");
    await requireAuth(req, res, next);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and attaches user to req when token is valid", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "1", email: "a@b.com" } },
      error: null,
    });
    getOrCreateUserMock.mockResolvedValue({
      id: "1",
      email: "a@b.com",
      role: "client",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const { req, res, next } = makeArgs("Bearer valid.token");
    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: "1",
      email: "a@b.com",
      role: "client",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(getUserMock).toHaveBeenCalledWith("valid.token");
    expect(getOrCreateUserMock).toHaveBeenCalledWith({
      id: "1",
      email: "a@b.com",
    });
  });
});
