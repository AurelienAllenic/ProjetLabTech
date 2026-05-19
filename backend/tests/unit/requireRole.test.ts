import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "../../middlewares/requireRole.js";
import type { JwtPayload } from "../../types.js";

function makeArgs(role?: JwtPayload["role"]) {
  const req = {
    user: role
      ? { userId: "1", email: "a@b.com", role, displayName: "Alice" }
      : undefined,
  } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe("requireRole", () => {
  it("calls next when role matches", () => {
    const { req, res, next } = makeArgs("labo");
    requireRole("labo")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(vi.mocked(res.status)).not.toHaveBeenCalled();
  });

  it("returns 403 when user has the wrong role", () => {
    const { req, res, next } = makeArgs("userLabo");
    requireRole("labo")(req, res, next);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when there is no authenticated user", () => {
    const { req, res, next } = makeArgs();
    requireRole("labo")(req, res, next);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
