import type { ReactNode } from "react";

/** Données saisies pour un test de laboratoire */
export interface TestValueData {
  value: string;
  unit: string;
  min: string;
  max: string;
}

/** Un élément brut retourné par l'API d'analyse */
export interface ApiElement {
  nom?: string;
  taux?: string;
  intervalle?: string;
  categorie?: string;
  explication?: string;
}

/** Structure complète du résultat d'analyse renvoyé par l'API */
export interface AnalysisApiResult {
  success?: boolean;
  result?: {
    elements?: ApiElement[];
    warning?: string;
    /** Synthèse rédigée (IA PDF ou saisie manuelle) */
    conclusion?: string;
  };
}

export type MedicalResultKind = "normal" | "low" | "high" | "attention";

/** Position numérique par rapport à l’intervalle parsé (indépendamment du libellé IA). */
export type ParsedRangePosition = "below" | "within" | "above" | "unknown";

/** Champs dérivés du parsing des chaînes `taux` / `intervalle` pour tableaux et graphiques. */
export interface ParsedLabMetrics {
  valueNumeric: number | null;
  refLow: number | null;
  refHigh: number | null;
  unit: string | null;
  rangePosition: ParsedRangePosition;
  /** Écart relatif au centre de l’intervalle (borne basse ≈ −100 %, haute ≈ +100 %). */
  deviationPercent: number | null;
}

/** Un résultat médical formaté pour l'affichage */
export interface MedicalResult {
  id: number;
  name: string;
  value: string;
  /** Intervalle de référence affiché tel que renvoyé par l’API */
  referenceRange: string;
  /** Libellé brut ou dérivé de `categorie` (ex. trop bas, trop élevé) */
  categoryLabel: string;
  kind: MedicalResultKind;
  status: "normal" | "abnormal";
  resultIcon: ReactNode;
  color: string;
  bgColor: string;
  statusColor: string;
  explanation: string;
  parsed?: ParsedLabMetrics;
}

/** State transmis par Manual → ManualValues via react-router */
export interface ManualNavigationState {
  tests: string[];
  sex: string;
  age: number;
}
