import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const { dbMock, storageOps } = vi.hoisted(() => {
  const insertBuilder = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  };
  const selectBuilder = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
  };
  const storageOps = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: "https://example.com/signed.pdf" },
      error: null,
    }),
  };
  const dbMock = {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      documentAssignments: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => insertBuilder),
    select: vi.fn(() => selectBuilder),
    __insertBuilder: insertBuilder,
    __selectBuilder: selectBuilder,
  };

  return { dbMock, storageOps };
});

vi.mock("../../db/client.js", () => ({
  db: dbMock,
}));

vi.mock("../../lib/supabaseAdmin.js", () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: vi.fn(() => storageOps),
    },
  }),
}));

import {
  createAssignment,
  createAssignmentFromUpload,
  getAssignmentSignedUrl,
  listAssignments,
  listMyAssignments,
} from "../../controllers/assignmentsController.js";

const AUTH_LAB = {
  id: "labo-1",
  email: "labo@demo.lab",
  displayName: "Admin",
  role: "laboratory" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const AUTH_CLIENT = {
  id: "user-1",
  email: "user@demo.lab",
  displayName: "Patient Lab",
  role: "client" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const ASSIGNMENT_ROW = {
  id: "a-1",
  userId: "user-1",
  documentId: "d-1",
  documentTitle: "Guide",
  storagePath: null,
  assignedBy: "labo-1",
  assignedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function makeReqRes(
  body: Record<string, unknown> = {},
  user: typeof AUTH_LAB | typeof AUTH_CLIENT = AUTH_LAB
) {
  const req = { body, user } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  return { req, res };
}

describe("assignmentsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when assignment payload is incomplete", async () => {
    const { req, res } = makeReqRes({ documentId: "d-1", documentTitle: "Guide" });

    await createAssignment(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 404 when target user does not exist", async () => {
    dbMock.query.users.findFirst.mockResolvedValue(undefined);
    const { req, res } = makeReqRes({
      assignedToEmail: "ghost@test.com",
      documentId: "d-1",
      documentTitle: "Guide",
    });

    await createAssignment(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(404);
  });

  it("returns 201 with the assignment on success", async () => {
    dbMock.query.users.findFirst.mockResolvedValue({ id: "user-1" });
    dbMock.__insertBuilder.returning.mockResolvedValue([ASSIGNMENT_ROW]);
    const { req, res } = makeReqRes({
      assignedToEmail: "a@b.com",
      documentId: "d-1",
      documentTitle: "Guide",
    });

    await createAssignment(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(201);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      assignment: expect.objectContaining({
        id: "a-1",
        document_id: "d-1",
        document_title: "Guide",
      }),
    });
  });

  it("uploads a PDF before creating an assignment", async () => {
    dbMock.query.users.findFirst.mockResolvedValue({ id: "user-1" });
    dbMock.__insertBuilder.returning.mockResolvedValue([
      { ...ASSIGNMENT_ROW, storagePath: "labo-1/file.pdf" },
    ]);
    const { req, res } = makeReqRes({
      assignedToEmail: "a@b.com",
    });
    req.file = {
      buffer: Buffer.from("%PDF"),
      originalname: "rapport.pdf",
      mimetype: "application/pdf",
      size: 12,
    } as Express.Multer.File;

    await createAssignmentFromUpload(req, res);

    expect(storageOps.upload).toHaveBeenCalled();
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(201);
  });

  it("lists assignments created by the laboratory", async () => {
    dbMock.__selectBuilder.orderBy.mockResolvedValue([
      {
        assignment: ASSIGNMENT_ROW,
        assignedUser: { email: "client@test.com", displayName: "Client" },
      },
    ]);
    const { req, res } = makeReqRes();

    await listAssignments(req, res);

    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      assignments: [
        expect.objectContaining({
          users: { email: "client@test.com", display_name: "Client" },
        }),
      ],
    });
  });

  it("lists assignments for the connected client", async () => {
    dbMock.query.documentAssignments.findMany.mockResolvedValue([ASSIGNMENT_ROW]);
    const { req, res } = makeReqRes({}, AUTH_CLIENT);

    await listMyAssignments(req, res);

    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      assignments: [expect.objectContaining({ id: "a-1" })],
    });
  });

  it("returns signedUrl when storage_path is set", async () => {
    dbMock.query.documentAssignments.findFirst.mockResolvedValue({
      ...ASSIGNMENT_ROW,
      storagePath: "lab/file.pdf",
    });
    const req = {
      params: { assignmentId: "asg-1" },
      user: AUTH_CLIENT,
    } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await getAssignmentSignedUrl(req, res);

    expect(storageOps.createSignedUrl).toHaveBeenCalledWith("lab/file.pdf", 600);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      signedUrl: "https://example.com/signed.pdf",
    });
  });
});
