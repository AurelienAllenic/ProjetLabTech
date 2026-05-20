import "dotenv/config";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase.js";
const hash = await bcrypt.hash("demo", 10);
const { error } = await supabase.from("users").upsert([
    {
        email: "user@demo.lab",
        password_hash: hash,
        display_name: "Jhon Doe",
        role: "userLabo",
    },
    {
        email: "labo@demo.lab",
        password_hash: hash,
        display_name: "Administrateur Laboratoire",
        role: "labo",
    },
], { onConflict: "email" });
if (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
}
console.log("✅ Seed OK — comptes demo créés");
