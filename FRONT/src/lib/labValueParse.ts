import type { ParsedRangePosition } from "../types";

/**
 * Extraction de nombres et d’unités à partir des chaînes renvoyées par l’analyse (PDF / IA).
 * Les formats labo français varient ; on couvre les cas les plus courants.
 */

const NUM_RE = /-?\d+(?:[.,]\d+)?/g;

function toFloat(raw: string): number {
  return Number.parseFloat(raw.replace(",", "."));
}

/** Première valeur numérique mesurée + unité éventuelle après le nombre (ex. "14 g/dL", "< 5 mg/L"). */
export function parseMeasuredValue(raw: string): {
  numeric: number | null;
  unit: string | null;
} {
  const s = raw.replace(/\u00a0/g, " ").trim();
  if (!s) return { numeric: null, unit: null };

  const m = s.match(/^([<>≤≥]=?\s*)?(-?\d+(?:[.,]\d+)?)/);
  if (!m || m[2] === undefined) return { numeric: null, unit: null };

  const numeric = toFloat(m[2]);
  const matchStart = m.index ?? 0;
  const rest = s.slice(matchStart + m[0].length).trim();
  const unit = rest.length > 0 ? rest.replace(/^[,;]\s*/, "") : null;

  return { numeric: Number.isFinite(numeric) ? numeric : null, unit };
}

/** Deux bornes d’intervalle + unité commune si présente (ex. "13,0 – 17,5 g/dL"). */
export function parseReferenceRange(raw: string): {
  low: number | null;
  high: number | null;
  unit: string | null;
} {
  const s = raw.replace(/\u00a0/g, " ").trim();
  if (!s || /^non communiqué/i.test(s)) {
    return { low: null, high: null, unit: null };
  }

  const matches = [...s.matchAll(NUM_RE)];
  if (matches.length < 2) return { low: null, high: null, unit: null };

  let a = toFloat(matches[0][0]);
  let b = toFloat(matches[1][0]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return { low: null, high: null, unit: null };
  }
  if (a > b) [a, b] = [b, a];

  const afterSecond = s.slice((matches[1].index ?? 0) + matches[1][0].length).trim();
  const unit = afterSecond.replace(/^[-–—aàA,;]\s*/, "").trim() || null;

  return { low: a, high: b, unit };
}

export function inferRangePosition(
  value: number | null,
  low: number | null,
  high: number | null,
): ParsedRangePosition {
  if (value === null || low === null || high === null) return "unknown";
  if (value < low) return "below";
  if (value > high) return "above";
  return "within";
}

/** Pourcentage par rapport au centre de l’intervalle (indicatif). */
export function deviationFromMidpoint(
  value: number | null,
  low: number | null,
  high: number | null,
): number | null {
  if (value === null || low === null || high === null || high === low) return null;
  const mid = (low + high) / 2;
  return ((value - mid) / ((high - low) / 2)) * 100;
}

export function formatLabNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
}
