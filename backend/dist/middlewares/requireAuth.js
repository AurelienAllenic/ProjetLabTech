import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Non authentifié" });
        return;
    }
    try {
        const token = header.slice(7);
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    }
    catch {
        res.status(401).json({ error: "Token invalide ou expiré" });
    }
}
