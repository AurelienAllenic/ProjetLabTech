import { describe, it, expect, vi } from "vitest";
import { requireRole } from "../../middlewares/requireRole.js";
function makeArgs(role) {
    const req = {
        user: role
            ? { userId: "1", email: "a@b.com", role, displayName: "Alice" }
            : undefined,
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
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
