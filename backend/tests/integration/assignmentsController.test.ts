import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

const { builderMock, storageOps } = vi.hoisted(() => {
  const builderMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };
  const storageOps = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: "https://example.com/signed.pdf" },
      error: null,
    }),
  };
  return { builderMock, storageOps };
});

vi.mock("../../lib/supabase.js", () => ({
  supabase: {
    from: vi.fn(() => builderMock),
    storage: {
      from: vi.fn(() => storageOps),
    },
  },
}));

import {
  createAssignment,
  createAssignmentFromUpload,
  getAssignmentSignedUrl,
  listAssignments,
  listMyAssignments,
} from "../../controllers/assignmentsController.js";

const AUTH_LAB = {
  userId: "labo-1",
  email: "labo@demo.lab",
  role: "labo" as const,
  displayName: "Admin",
};

const AUTH_USER_LAB = {
  userId: "user-1",
  email: "user@demo.lab",
  role: "userLabo" as const,
  displayName: "Patient Lab",
};

function makeReqRes(body: Record<string, unknown> = {}) {
  const req = { body, user: AUTH_LAB } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  return { req, res };
}

describe("createAssignment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when assignedToEmail is missing", async () => {
    const { req, res } = makeReqRes({ documentId: "d-1", documentTitle: "Guide" });
    await createAssignment(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 400 when documentId is missing", async () => {
    const { req, res } = makeReqRes({ assignedToEmail: "a@b.com", documentTitle: "Guide" });
    await createAssignment(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 400 when documentTitle is missing", async () => {
    const { req, res } = makeReqRes({ assignedToEmail: "a@b.com", documentId: "d-1" });
    await createAssignment(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 404 when target user does not exist", async () => {
    builderMock.single.mockResolvedValue({ data: null, error: { message: "not found" } });
    const { req, res } = makeReqRes({
      assignedToEmail: "ghost@b.com",
      documentId: "d-1",
      documentTitle: "Guide",
    });
    await createAssignment(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(404);
  });

  it("returns 500 when the insert fails", async () => {
    builderMock.single
      .mockResolvedValueOnce({ data: { id: "user-1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "insert error" } });
    const { req, res } = makeReqRes({
      assignedToEmail: "a@b.com",
      documentId: "d-1",
      documentTitle: "Guide",
    });
    await createAssignment(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(500);
  });

  it("returns 201 with the assignment on success", async () => {
    const assignment = {
      id: "a-1",
      document_id: "d-1",
      document_title: "Guide",
      assigned_at: "2026-01-01",
    };
    builderMock.single
      .mockResolvedValueOnce({ data: { id: "user-1" }, error: null })
      .mockResolvedValueOnce({ data: assignment, error: null });
    const { req, res } = makeReqRes({
      assignedToEmail: "a@b.com",
      documentId: "d-1",
      documentTitle: "Guide",
    });
    await createAssignment(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(201);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({ assignment });
  });
});

describe("createAssignmentFromUpload", () => {
  beforeEach(() => vi.clearAllMocks());

  function reqWithFile(body: Record<string, unknown>, file: Partial<Express.Multer.File> | undefined) {
    const req = {
      body,
      file,
      user: AUTH_LAB,
    } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    return { req, res };
  }

  it("returns 400 when email or file missing", async () => {
    const { req, res } = reqWithFile({ assignedToEmail: "a@b.com" }, undefined);
    await createAssignmentFromUpload(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 400 when file is not a pdf", async () => {
    const { req, res } = reqWithFile(
      { assignedToEmail: "a@b.com" },
      {
        buffer: Buffer.from("x"),
        originalname: "x.exe",
        mimetype: "application/octet-stream",
        size: 1,
      },
    );
    await createAssignmentFromUpload(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
  });

  it("returns 201 with assignment on success", async () => {
    const inserted = {
      id: "asg-1",
      document_id: "uuid-doc",
      document_title: "rapport.pdf",
      storage_path: "labo-1/uuid-doc.pdf",
      assigned_at: "2026-01-01",
    };
    builderMock.single
      .mockResolvedValueOnce({ data: { id: "target-user" }, error: null })
      .mockResolvedValueOnce({ data: inserted, error: null });

    const { req, res } = reqWithFile(
      { assignedToEmail: "a@b.com" },
      {
        buffer: Buffer.from("%PDF"),
        originalname: "rapport.pdf",
        mimetype: "application/pdf",
        size: 12,
      },
    );

    await createAssignmentFromUpload(req, res);

    expect(storageOps.upload).toHaveBeenCalled();
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(201);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({ assignment: inserted });
  });
});

describe("listAssignments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the list of assignments", async () => {
    const assignments = [{ id: "a-1", document_title: "Guide", assigned_at: "2026-01-01" }];
    builderMock.order.mockResolvedValue({ data: assignments, error: null });
    const { req, res } = makeReqRes();
    await listAssignments(req, res);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({ assignments });
  });

  it("returns 500 on DB error", async () => {
    builderMock.order.mockResolvedValue({ data: null, error: { message: "fail" } });
    const { req, res } = makeReqRes();
    await listAssignments(req, res);
    expect(vi.mocked(res.status)).toHaveBeenCalledWith(500);
  });
});

describe("listMyAssignments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns assignments for the connected userLabo", async () => {
    const rows = [{ id: "x", document_title: "Rapport.pdf", assigned_at: "2026-02-01" }];
    builderMock.order.mockResolvedValue({ data: rows, error: null });
    const req = { body: {}, user: AUTH_USER_LAB } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    await listMyAssignments(req, res);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({ assignments: rows });
  });
});

describe("getAssignmentSignedUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns signedUrl when storage_path is set", async () => {
    builderMock.maybeSingle.mockResolvedValue({
      data: { storage_path: "lab/file.pdf" },
      error: null,
    });
    const req = {
      params: { assignmentId: "asg-1" },
      user: AUTH_USER_LAB,
    } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await getAssignmentSignedUrl(req, res);

    expect(storageOps.createSignedUrl).toHaveBeenCalledWith("lab/file.pdf", 600);
    expect(vi.mocked(res.json)).toHaveBeenCalledWith({
      signedUrl: "https://example.com/signed.pdf",
    });
  });

  it("returns 404 when no storage_path", async () => {
    builderMock.maybeSingle.mockResolvedValue({
      data: { storage_path: null },
      error: null,
    });
    const req = {
      params: { assignmentId: "asg-1" },
      user: AUTH_USER_LAB,
    } as unknown as Request;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;

    await getAssignmentSignedUrl(req, res);

    expect(vi.mocked(res.status)).toHaveBeenCalledWith(404);
  });
});
