import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";
import { getOrCreateUser } from "../services/usersService.js";

const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
};

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }

    const { data, error } = await supabase.auth.getUser(token);
    const user = data.user;

    if (error || !user?.id || !user.email) {
      res.status(401).json({ error: "Token invalide ou expiré" });
      return;
    }

    const appUser = await getOrCreateUser({
      id: user.id,
      email: user.email,
    });

    req.user = {
      id: appUser.id,
      email: appUser.email,
      role: appUser.role,
      createdAt: appUser.createdAt,
    };

    next();
  } catch (error) {
    next(error);
  }
}
