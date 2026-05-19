import type { Request, Response } from "express";
import {
  createClientUser,
  UserAlreadyExistsError,
} from "../services/usersService.js";

export async function createClient(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as {
    email?: string;
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
      createdBy: req.user.id,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_by: user.createdBy,
        created_at: user.createdAt.toISOString(),
      },
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
