import { describe, it, expect, vi, beforeEach } from "vitest";
const { builderMock } = vi.hoisted(() => {
    const builderMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        order: vi.fn(),
        single: vi.fn(),
    };
    return { builderMock };
});
vi.mock("../../lib/supabase.js", () => ({ supabase: { from: vi.fn(() => builderMock) } }));
import { createAssignment, listAssignments } from "../../controllers/assignmentsController.js";
const AUTH_USER = { userId: "labo-1", email: "labo@demo.lab", role: "labo", displayName: "Admin" };
function makeReqRes(body = {}) {
    const req = { body, user: AUTH_USER };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
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
        const { req, res } = makeReqRes({ assignedToEmail: "ghost@b.com", documentId: "d-1", documentTitle: "Guide" });
        await createAssignment(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(404);
    });
    it("returns 500 when the insert fails", async () => {
        builderMock.single
            .mockResolvedValueOnce({ data: { id: "user-1" }, error: null })
            .mockResolvedValueOnce({ data: null, error: { message: "insert error" } });
        const { req, res } = makeReqRes({ assignedToEmail: "a@b.com", documentId: "d-1", documentTitle: "Guide" });
        await createAssignment(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(500);
    });
    it("returns 201 with the assignment on success", async () => {
        const assignment = { id: "a-1", document_id: "d-1", document_title: "Guide", assigned_at: "2026-01-01" };
        builderMock.single
            .mockResolvedValueOnce({ data: { id: "user-1" }, error: null })
            .mockResolvedValueOnce({ data: assignment, error: null });
        const { req, res } = makeReqRes({ assignedToEmail: "a@b.com", documentId: "d-1", documentTitle: "Guide" });
        await createAssignment(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(201);
        expect(vi.mocked(res.json)).toHaveBeenCalledWith({ assignment });
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
