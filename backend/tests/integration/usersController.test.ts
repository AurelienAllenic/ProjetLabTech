import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { createClientUserMock, MockUserAlreadyExistsError } = vi.hoisted(() => {
  class MockUserAlreadyExistsError extends Error {
    constructor(email: string) {
      super(`User already exists: ${email}`);
      this.name = "UserAlreadyExistsError";
    }
  }

  return {
    createClientUserMock: vi.fn(),
    MockUserAlreadyExistsError,
  };
});

vi.mock("../../services/usersService.js", () => {
  return {
    createClientUser: createClientUserMock,
    UserAlreadyExistsError: MockUserAlreadyExistsError,
  };
});

import { createClient } from "../../controllers/usersController.js";
import { UserAlreadyExistsError } from "../../services/usersService.js";

const AUTH_USER = {
  id: "lab-1",
  email: "lab@test.com",
  role: "laboratory" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function makeReqRes(body: Record<string, unknown> = {}, authenticated = true) {
  const req = {
    body,
    user: authenticated ? AUTH_USER : undefined,
  } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

  return { req, res };
}

describe("createClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when email is missing", async () => {
    const { req, res } = makeReqRes({ password: "secret1" });

    await createClient(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 400 when password is too short", async () => {
    const { req, res } = makeReqRes({ email: "client@test.com", password: "123" });

    await createClient(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 401 when no authenticated user is attached", async () => {
    const { req, res } = makeReqRes(
      { email: "client@test.com", password: "secret1" },
      false
    );

    await createClient(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
  });

  it("returns 409 when the user already exists", async () => {
    createClientUserMock.mockRejectedValue(new UserAlreadyExistsError("client@test.com"));
    const { req, res } = makeReqRes({ email: "client@test.com", password: "secret1" });

    await createClient(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(409);
  });

  it("returns 201 with created client on success", async () => {
    createClientUserMock.mockResolvedValue({
      id: "client-1",
      email: "client@test.com",
      role: "client",
      createdBy: "lab-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const { req, res } = makeReqRes({ email: "client@test.com", password: "secret1" });

    await createClient(req, res);

    expect(createClientUserMock).toHaveBeenCalledWith({
      email: "client@test.com",
      password: "secret1",
      createdBy: "lab-1",
    });
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(201);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      user: {
        id: "client-1",
        email: "client@test.com",
        role: "client",
        created_by: "lab-1",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });
  });
});
