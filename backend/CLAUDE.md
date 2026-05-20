# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the server
npm run dev        # starts the TypeScript server on port 3001 (or PORT env var)
npm start          # runs the compiled dist/app.js

# Validate
npm run typecheck
npm test
npm run parse:pdf

# Drizzle / Supabase Postgres
npm run db:generate
npm run db:migrate
npm run db:push

# Bootstrap first laboratory user
npm run user:create-lab -- labo@example.com "change-me"
```

Vitest is configured for backend unit and integration tests.

## Environment

Requires a `.env` file with:
- `MISTRAL_API_KEY` — Mistral AI API key (`API_KEY` still works as a fallback)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon/public key, used only for Supabase Auth
- `DATABASE_URL` — Supabase Postgres connection string for Drizzle/postgres-js
- `FRONTEND_URL` — optional additional allowed CORS origin

## Architecture

Express API (ESM modules, `"type": "module"` in package.json).

**Auth / users flow:**

1. `lib/supabase.ts` creates a Supabase client used only for Auth calls.
2. `middlewares/requireAuth.ts` reads `Authorization: Bearer <token>` and verifies it with `supabase.auth.getUser`.
3. `db/client.ts` connects to Supabase Postgres with `postgres-js`.
4. `db/schema.ts` defines the application `users` table with `laboratory` and `client` roles.
5. `services/usersService.ts` implements get-or-create user and client creation with Drizzle.
6. `middlewares/requireRole.ts` gates laboratory-only routes.
7. `routes/meRoute.ts` exposes protected `GET /me`.
8. `routes/usersRoutes.ts` exposes `POST /users/clients` for laboratory users.

**Request flow for `POST /analyse`:**

1. `routes/analyseRoutes.ts` — accepts a multipart `pdf` file via `multer`, forwards to controller
2. `controllers/analyseController.ts` — orchestrates the pipeline:
   - Extracts raw text from the PDF buffer (`extractPdfText`)
   - Cleans/normalizes the text (`cleanLabReport`)
   - Truncates to 5000 chars before sending to the AI
   - Calls Mistral, then parses the JSON response (`extractJsonSafe`)
   - Returns at most 8 lab result elements; falls back to an empty array with a warning if JSON parsing fails
3. `services/pdfTextService.ts` — PDF text extraction via `unpdf`, plus a `cleanLabReport` function that collapses repeated dots/dashes
4. `services/mistralService.ts` — calls the Mistral API (`mistral-small-latest`) with a hardcoded prompt template that instructs the model to return a strict JSON structure of lab result elements

**Response shape:**
```json
{
  "success": true,
  "result": {
    "elements": [
      { "nom": "...", "taux": "...", "intervalle": "...", "categorie": "correct | trop élevé | trop bas", "explication": "..." }
    ]
  }
}
```

CORS is whitelisted for `localhost:5173` (Vite dev) and `https://projet-lab-tech-38dy.vercel.app` (production frontend).
