import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireRole } from "../../middlewares/requireRole.js";

function makeArgs(role?: "laboratory" | "client") {
  const req = {
    user: role
      ? {
          id: "user-1",
          email: "user@test.com",
          role,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        }
      : undefined,
  } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe("requireRole", () => {
  it("calls next when the role matches", () => {
    const { req, res, next } = makeArgs("laboratory");

    requireRole("laboratory")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(vi.mocked(res.status)).not.toHaveBeenCalled();
  });

  it("returns 403 when the role does not match", () => {
    const { req, res, next } = makeArgs("client");

    requireRole("laboratory")(req, res, next);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
