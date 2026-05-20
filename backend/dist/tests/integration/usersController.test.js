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
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));
import { createUser, listUsers } from "../../controllers/usersController.js";
const AUTH_USER = { userId: "labo-1", email: "labo@demo.lab", role: "labo", displayName: "Admin" };
function makeReqRes(body = {}) {
    const req = { body, user: AUTH_USER };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    return { req, res };
}
describe("createUser", () => {
    beforeEach(() => vi.clearAllMocks());
    it("returns 400 when email is missing", async () => {
        const { req, res } = makeReqRes({ displayName: "Alice", password: "pass" });
        await createUser(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
    });
    it("returns 400 when displayName is missing", async () => {
        const { req, res } = makeReqRes({ email: "a@b.com", password: "pass" });
        await createUser(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
    });
    it("returns 400 when password is missing", async () => {
        const { req, res } = makeReqRes({ email: "a@b.com", displayName: "Alice" });
        await createUser(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(400);
    });
    it("returns 409 when email already exists", async () => {
        builderMock.single.mockResolvedValue({ data: null, error: { code: "23505" } });
        const { req, res } = makeReqRes({ email: "a@b.com", displayName: "Alice", password: "pass" });
        await createUser(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(409);
    });
    it("returns 500 on unexpected DB error", async () => {
        builderMock.single.mockResolvedValue({ data: null, error: { code: "99999", message: "oops" } });
        const { req, res } = makeReqRes({ email: "a@b.com", displayName: "Alice", password: "pass" });
        await createUser(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(500);
    });
    it("returns 201 with created user on success", async () => {
        const created = { id: "u-1", email: "a@b.com", display_name: "Alice", role: "userLabo", created_at: "2026-01-01" };
        builderMock.single.mockResolvedValue({ data: created, error: null });
        const { req, res } = makeReqRes({ email: "a@b.com", displayName: "Alice", password: "pass" });
        await createUser(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(201);
        expect(vi.mocked(res.json)).toHaveBeenCalledWith({ user: created });
    });
});
describe("listUsers", () => {
    beforeEach(() => vi.clearAllMocks());
    it("returns the list of managed users", async () => {
        const users = [{ id: "u-1", email: "a@b.com", display_name: "Alice", role: "userLabo" }];
        builderMock.order.mockResolvedValue({ data: users, error: null });
        const { req, res } = makeReqRes();
        await listUsers(req, res);
        expect(vi.mocked(res.json)).toHaveBeenCalledWith({ users });
    });
    it("returns 500 on DB error", async () => {
        builderMock.order.mockResolvedValue({ data: null, error: { message: "fail" } });
        const { req, res } = makeReqRes();
        await listUsers(req, res);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(500);
    });
});
