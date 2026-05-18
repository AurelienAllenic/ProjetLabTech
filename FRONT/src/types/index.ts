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

import type { ReactNode } from "react";

/** Un résultat médical formaté pour l'affichage */
export interface MedicalResult {
  id: number;
  name: string;
  value: string;
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
