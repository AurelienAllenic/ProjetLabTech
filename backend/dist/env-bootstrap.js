/**
 * Charge `.env` avant tout import qui lit `process.env` (ex. `lib/supabase.ts`).
 * Cherche `backend/.env` que l’app soit lancée depuis la racine du backend ou depuis `dist/` après `tsc`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidates = [path.join(__dirname, ".env"), path.join(__dirname, "..", ".env")];
for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        break;
    }
}
