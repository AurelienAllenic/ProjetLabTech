import fetch from "node-fetch";
import type { MistralApiResponse } from "../types.js";

function getMistralApiKey(): string {
  const key = process.env.MISTRAL_API_KEY ?? process.env.API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Clé API Mistral absente : définissez API_KEY ou MISTRAL_API_KEY dans backend/.env",
    );
  }
  return key.trim();
}

/** Corps d’erreur Mistral : souvent `{ message, type, code }` à la racine, pas `{ error: { message } }`. */
function mistralErrorMessage(status: number, body: unknown, rawText: string): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) {
      return o.message.trim();
    }
    const err = o.error;
    if (err && typeof err === "object") {
      const nested = (err as Record<string, unknown>).message;
      if (typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }
    }
  }
  const trimmed = rawText.trim().slice(0, 400);
  return trimmed || `Erreur HTTP ${status} depuis l'API Mistral`;
}

const PROMPT_TEMPLATE_IMAGE = `
Tu dois répondre STRICTEMENT avec un JSON valide et COMPLET.
Aucun texte avant ou après.

RÈGLES ABSOLUES :
- Le JSON doit être entièrement fermé
- Tous les objets doivent être complets
- Ne JAMAIS couper une valeur
- Si la réponse est trop longue, résume les explications MAIS termine toujours le JSON
- Ne mets AUCUN commentaire

CONTRAINTE CRITIQUE :
- Tu dois retourner AU MAXIMUM 8 éléments dans "elements"
- Si le document contient plus d'analyses, ignore-les
- Ne dépasse jamais cette limite

Format OBLIGATOIRE :

{
  "elements": [
    {
      "nom": "...",
      "taux": "...",
      "intervalle": "...",
      "categorie": "correct | trop élevé | trop bas",
      "explication": "..."
    }
  ]
}

Analyse le résultat d'analyse de laboratoire visible dans cette image.
`;

const PROMPT_TEMPLATE = `
Tu dois répondre STRICTEMENT avec un JSON valide et COMPLET.
Aucun texte avant ou après.

RÈGLES ABSOLUES :
- Le JSON doit être entièrement fermé
- Tous les objets doivent être complets
- Ne JAMAIS couper une valeur
- Si la réponse est trop longue, résume les explications MAIS termine toujours le JSON
- Ne mets AUCUN commentaire

CONTRAINTE CRITIQUE :
- Tu dois retourner AU MAXIMUM 8 éléments dans "elements"
- Si le document contient plus d'analyses, ignore-les
- Ne dépasse jamais cette limite

Format OBLIGATOIRE :

{
  "elements": [
    {
      "nom": "...",
      "taux": "...",
      "intervalle": "...",
      "categorie": "correct | trop élevé | trop bas",
      "explication": "..."
    }
  ]
}

Analyse le texte suivant :
"""
{{TEXT_FROM_PDF}}
"""
`;

export async function generateTextFromImage(base64: string, mimeType: string): Promise<string> {
  const apiKey = getMistralApiKey();

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "pixtral-12b-2409",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: "text", text: PROMPT_TEMPLATE_IMAGE },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  const rawText = await response.text();
  let parsed: unknown;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    console.error("[Mistral Vision] Réponse non-JSON (HTTP %s): %s", response.status, rawText.slice(0, 500));
    throw new Error(`Réponse Mistral Vision invalide (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = mistralErrorMessage(response.status, parsed, rawText);
    console.error("[Mistral Vision] HTTP %s — %s", response.status, msg);
    throw new Error(msg);
  }

  const data = parsed as MistralApiResponse;
  let content = data.choices?.[0]?.message?.content ?? "";
  content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

  console.log("🧠 IA Vision RAW LENGTH:", content.length);
  return content;
}

export async function generateTextFromPdf(pdfText: string): Promise<string> {
  const prompt = PROMPT_TEMPLATE.replace("{{TEXT_FROM_PDF}}", pdfText);
  const apiKey = getMistralApiKey();

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  const rawText = await response.text();
  let parsed: unknown;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    console.error(
      "[Mistral] Réponse non-JSON (HTTP %s): %s",
      response.status,
      rawText.slice(0, 500),
    );
    throw new Error(`Réponse Mistral invalide (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = mistralErrorMessage(response.status, parsed, rawText);
    console.error("[Mistral] HTTP %s — %s", response.status, msg);
    throw new Error(msg);
  }

  const data = parsed as MistralApiResponse;

  let content = data.choices?.[0]?.message?.content ?? "";
  content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

  console.log("🧠 IA RAW LENGTH:", content.length);

  return content;
}
