import type { Request, Response, NextFunction } from "express";
import type { LabRole } from "../types.js";

export function requireRole(role: LabRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }
    next();
  };
}
