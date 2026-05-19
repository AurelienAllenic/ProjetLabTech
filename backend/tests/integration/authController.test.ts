import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { builderMock } = vi.hoisted(() => {
  const builderMock = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
  return { builderMock };
});

vi.mock("../../lib/supabase.js",  () => ({ supabase: { from: vi.fn(() => builderMock) } }));
vi.mock("bcryptjs",               () => ({ default: { compare: vi.fn() } }));
vi.mock("jsonwebtoken",           () => ({ default: { sign: vi.fn().mockReturnValue("mock.jwt") } }));

import bcrypt from "bcryptjs";
import { login, me } from "../../controllers/authController.js";

const mockCompare = vi.mocked(bcrypt.compare);

const MOCK_USER = {
  id: "uid-1",
  email: "user@demo.lab",
  password_hash: "$2a$10$hash",
  display_name: "Jhon Doe",
  role: "userLabo",
};

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

  it("returns 401 when user is not found in DB", async () => {
    builderMock.single.mockResolvedValue({ data: null, error: { message: "not found" } });
    const { req, res } = makeReqRes({ email: "unknown@test.com", password: "demo" });
    await login(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
  });

  it("returns 401 when password does not match", async () => {
    builderMock.single.mockResolvedValue({ data: MOCK_USER, error: null });
    mockCompare.mockResolvedValue(false as never);
    const { req, res } = makeReqRes({ email: "user@demo.lab", password: "wrong" });
    await login(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
  });

  it("returns token and user on success", async () => {
    builderMock.single.mockResolvedValue({ data: MOCK_USER, error: null });
    mockCompare.mockResolvedValue(true as never);
    const { req, res } = makeReqRes({ email: "user@demo.lab", password: "demo" });
    await login(req, res);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "mock.jwt",
        user: expect.objectContaining({ email: MOCK_USER.email, role: MOCK_USER.role }),
      }),
    );
  });
});

describe("me", () => {
  it("returns the authenticated user from req.user", () => {
    const user = { userId: "uid-1", email: "user@demo.lab", role: "userLabo", displayName: "Jhon Doe" };
    const { req, res } = makeReqRes({}, user);
    me(req, res);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      user: { email: user.email, displayName: user.displayName, role: user.role },
    });
  });
});
