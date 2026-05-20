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
  };
}

export type MedicalResultKind = "normal" | "low" | "high" | "attention";

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
}

/** State transmis par Manual → ManualValues via react-router */
export interface ManualNavigationState {
  tests: string[];
  sex: string;
  age: number;
}
