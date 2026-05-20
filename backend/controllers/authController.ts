import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { getOrCreateUser } from "../services/usersService.js";
import type { UserRole } from "../types.js";

function toFrontendRole(role: UserRole): "labo" | "userLabo" {
  return role === "laboratory" ? "labo" : "userLabo";
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email et mot de passe requis" });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.session?.access_token || !data.user?.email) {
    res.status(401).json({ error: "Identifiants incorrects" });
    return;
  }

  const user = await getOrCreateUser({
    id: data.user.id,
    email: data.user.email,
    displayName:
      typeof data.user.user_metadata?.display_name === "string"
        ? data.user.user_metadata.display_name
        : undefined,
  });

  res.json({
    token: data.session.access_token,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: toFrontendRole(user.role),
      created_at: user.createdAt.toISOString(),
    },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName,
      role: toFrontendRole(req.user.role),
      created_at: req.user.createdAt.toISOString(),
    },
  });
}
