import type { Request, Response } from "express";
import {
  createClientUser,
  listUsersCreatedBy,
  UserAlreadyExistsError,
} from "../services/usersService.js";

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

    res.status(201).json({
      user: serializeUser(user),
    });
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
