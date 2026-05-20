import crypto from "crypto";
import type { Request, Response } from "express";
import {
  createClientUser,
  listUsersCreatedBy,
  UserAlreadyExistsError,
} from "../services/usersService.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";
import { sendPasswordSetupEmail } from "../services/mailService.js";

function serializeUser(user: Awaited<ReturnType<typeof createClientUser>>) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    role: user.role === "laboratory" ? "labo" : "userLabo",
    created_by: user.createdBy,
    created_at: user.createdAt.toISOString(),
  };
}

export async function createClient(req: Request, res: Response): Promise<void> {
  const { email, displayName, password } = req.body as {
    email?: string;
    displayName?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "email et password requis" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  try {
    const user = await createClientUser({
      email,
      password,
      displayName,
      createdBy: req.user.id,
    });

    // Générer un token de définition du mot de passe (valide 24h)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await getSupabaseAdmin().from("password_reset_tokens").insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost";
    console.log(`[set-password] ${frontendUrl}/set-password?token=${token}`);

    if (process.env.NODE_ENV !== "development") {
      try {
        await sendPasswordSetupEmail(user.email, user.displayName ?? user.email, token);
      } catch (mailErr) {
        console.error("sendPasswordSetupEmail error:", mailErr);
      }
    }

    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      res.status(409).json({ error: "Un compte avec cet e-mail existe déjà" });
      return;
    }

    console.error("createClient error:", error);
    res.status(500).json({ error: "Erreur lors de la création du client" });
  }
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const users = await listUsersCreatedBy(req.user.id);

  res.json({
    users: users.map(serializeUser),
  });
}
