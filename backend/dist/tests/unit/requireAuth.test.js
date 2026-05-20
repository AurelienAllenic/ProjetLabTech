import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("jsonwebtoken", () => ({
    default: { verify: vi.fn() },
}));
import jwt from "jsonwebtoken";
import { requireAuth } from "../../middlewares/requireAuth.js";
const mockVerify = vi.mocked(jwt.verify);
function makeArgs(authHeader) {
    const req = { headers: { authorization: authHeader } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    return { req, res, next };
}
describe("requireAuth", () => {
    beforeEach(() => vi.clearAllMocks());
    it("returns 401 when Authorization header is absent", () => {
        const { req, res, next } = makeArgs();
        requireAuth(req, res, next);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it("returns 401 when header does not start with Bearer", () => {
        const { req, res, next } = makeArgs("Basic abc123");
        requireAuth(req, res, next);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it("returns 401 when token is invalid", () => {
        mockVerify.mockImplementation(() => { throw new Error("invalid"); });
        const { req, res, next } = makeArgs("Bearer bad.token");
        requireAuth(req, res, next);
        expect(vi.mocked(res.status)).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    it("calls next and attaches user to req when token is valid", () => {
        const payload = { userId: "1", email: "a@b.com", role: "userLabo", displayName: "Alice" };
        mockVerify.mockReturnValue(payload);
        const { req, res, next } = makeArgs("Bearer valid.token");
        requireAuth(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(payload);
    });
});
