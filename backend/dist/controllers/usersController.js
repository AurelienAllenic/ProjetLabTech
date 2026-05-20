import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase.js";
export async function createUser(req, res) {
    const { email, displayName, password } = req.body;
    if (!email || !displayName || !password) {
        res.status(400).json({ error: "email, displayName et password requis" });
        return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
        .from("users")
        .insert({
        email: email.trim().toLowerCase(),
        password_hash,
        display_name: displayName.trim(),
        role: "userLabo",
        created_by: req.user.userId,
    })
        .select("id, email, display_name, role, created_at")
        .single();
    if (error) {
        if (error.code === "23505") {
            res.status(409).json({ error: "Un compte avec cet e-mail existe déjà" });
        }
        else {
            console.error("createUser error:", error);
            res.status(500).json({ error: "Erreur lors de la création du compte" });
        }
        return;
    }
    res.status(201).json({ user: data });
}
export async function listUsers(req, res) {
    const { data, error } = await supabase
        .from("users")
        .select("id, email, display_name, role, created_at")
        .eq("created_by", req.user.userId)
        .order("created_at", { ascending: false });
    if (error) {
        console.error("listUsers error:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des comptes" });
        return;
    }
    res.json({ users: data });
}
