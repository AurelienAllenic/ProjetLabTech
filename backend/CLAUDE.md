# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the server
npm start          # runs node app.js on port 3001 (or PORT env var)

# Run the PDF parsing test
node functionsTests/parsingTest.js
```

There is no test framework configured — `functionsTests/parsingTest.js` is a standalone script (note: it imports from `../middlesWares/pdfToText.js` which is a stale path; the actual service is at `servises/pdfToTextService.js`).

## Environment

Requires a `.env` file with:
- `API_KEY` — Mistral AI API key
- `FRONTEND_URL` — optional additional allowed CORS origin

## Architecture

Single-route Express API (ESM modules, `"type": "module"` in package.json).

**Request flow for `POST /analyse`:**

1. `routes/analyseSammaryRoute.js` — accepts a multipart `pdf` file via `multer`, forwards to controller
2. `controllers/anlyseController.js` — orchestrates the pipeline:
   - Extracts raw text from the PDF buffer (`extractPdfText`)
   - Cleans/normalizes the text (`cleanLabReport`)
   - Truncates to 5000 chars before sending to the AI
   - Calls Mistral, then parses the JSON response (`extractJsonSafe`)
   - Returns at most 8 lab result elements; falls back to an empty array with a warning if JSON parsing fails
3. `servises/pdfToTextService.js` — PDF text extraction via `unpdf`, plus a `cleanLabReport` function that collapses repeated dots/dashes
4. `servises/callMistralService.js` — calls the Mistral API (`mistral-small-latest`) with a hardcoded prompt template that instructs the model to return a strict JSON structure of lab result elements

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
