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

/** Corps d'erreur Mistral : souvent `{ message, type, code }` à la racine, pas `{ error: { message } }`. */
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

const SHARED_RULES = `
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

PRÉCISION DES CHIFFRES (obligatoire quand le PDF les contient) :
- "taux" : une seule valeur mesurée suivie de son unité SI (ex. "14 g/dL", "5,2 mmol/L").
- "intervalle" : deux bornes numériques et la même unité que la mesure (ex. "13,0 – 17,5 g/dL").
- Utiliser la virgule comme séparateur décimal si c’est le cas dans le document.

CONCLUSION (obligatoire, champ racine "conclusion") :
- 2 à 4 phrases en français, vocabulaire accessible mais sérieux.
- Résume l’essentiel : par exemple « vous avez une valeur trop élevée en … », ou plusieurs anomalies, ou que les résultats sont globalement dans les normes pour les analyses extraites.
- Pour chaque écart notable, nomme le paramètre et indique s’il semble haut ou bas ; tu peux rappeler ce que cela peut évoquer de façon très générale (sans diagnostic ni traitement).
- Ne prétends pas que tout le bilan médical est normal si le document est incomplet.
- Termine toujours par une phrase précisant que seul un médecin ou un biologiste peut interpréter définitivement les résultats.

Format OBLIGATOIRE :

{
  "conclusion": "...",
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
`;

const PROMPT_TEMPLATE = `${SHARED_RULES}
Analyse le texte suivant :
"""
{{TEXT_FROM_PDF}}
"""
`;

const PROMPT_TEMPLATE_IMAGE = `${SHARED_RULES}
Analyse le résultat d'analyse de laboratoire visible dans cette image.
`;

async function callMistral(
  body: Record<string, unknown>,
  errorLabel: string,
): Promise<string> {
  const apiKey = getMistralApiKey();

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let parsed: unknown;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    console.error(
      "[%s] Réponse non-JSON (HTTP %s): %s",
      errorLabel,
      response.status,
      rawText.slice(0, 500),
    );
    throw new Error(`Réponse ${errorLabel} invalide (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const msg = mistralErrorMessage(response.status, parsed, rawText);
    console.error("[%s] HTTP %s — %s", errorLabel, response.status, msg);
    throw new Error(msg);
  }

  const data = parsed as MistralApiResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  return content.replace(/```json/gi, "").replace(/```/g, "").trim();
}

export async function generateTextFromPdf(pdfText: string): Promise<string> {
  const prompt = PROMPT_TEMPLATE.replace("{{TEXT_FROM_PDF}}", pdfText);

  const content = await callMistral(
    {
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 3000,
    },
    "Mistral",
  );

  console.log("AI raw response length:", content.length);
  return content;
}

export async function generateTextFromImage(
  base64: string,
  mimeType: string,
): Promise<string> {
  const content = await callMistral(
    {
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
    },
    "Mistral Vision",
  );

  console.log("AI vision raw response length:", content.length);
  return content;
}
