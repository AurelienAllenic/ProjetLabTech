import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";
export async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: "Email et mot de passe requis" });
        return;
    }
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .single();
    if (error || !user) {
        res.status(401).json({ error: "Identifiants incorrects" });
        return;
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        res.status(401).json({ error: "Identifiants incorrects" });
        return;
    }
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
        token,
        user: { email: user.email, displayName: user.display_name, role: user.role },
    });
}
export function me(req, res) {
    const u = req.user;
    res.json({ user: { email: u.email, displayName: u.displayName, role: u.role } });
}
