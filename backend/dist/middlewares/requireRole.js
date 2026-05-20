export function requireRole(role) {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            res.status(403).json({ error: "Accès refusé" });
            return;
        }
        next();
    };
}
