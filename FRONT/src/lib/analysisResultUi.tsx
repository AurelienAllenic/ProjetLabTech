import type { ReactNode } from "react";
import { Smile, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import type {
  ApiElement,
  MedicalResult,
  MedicalResultKind,
  ParsedLabMetrics,
} from "../types";
import {
  deviationFromMidpoint,
  inferRangePosition,
  parseMeasuredValue,
  parseReferenceRange,
} from "./labValueParse";

interface KindUi {
  color: string;
  bgColor: string;
  statusColor: string;
  icon: ReactNode;
}

function iconProps(className: string): { className: string; "aria-hidden": boolean } {
  return { className, "aria-hidden": true as const };
}

const KIND_UI: Record<MedicalResultKind, KindUi> = {
  normal: {
    color: "border-green-400",
    bgColor: "bg-green-50",
    statusColor: "bg-green-100 text-green-800",
    icon: <Smile {...iconProps("h-8 w-8 text-green-600")} />,
  },
  low: {
    color: "border-blue-400",
    bgColor: "bg-blue-50",
    statusColor: "bg-blue-100 text-blue-800",
    icon: <TrendingDown {...iconProps("h-8 w-8 text-blue-600")} />,
  },
  high: {
    color: "border-orange-400",
    bgColor: "bg-orange-50",
    statusColor: "bg-orange-100 text-orange-900",
    icon: <TrendingUp {...iconProps("h-8 w-8 text-orange-600")} />,
  },
  attention: {
    color: "border-amber-400",
    bgColor: "bg-amber-50",
    statusColor: "bg-amber-100 text-amber-900",
    icon: <AlertCircle {...iconProps("h-8 w-8 text-amber-600")} />,
  },
};

/**
 * Interprète la chaîne `categorie` de l’API (normal, trop bas, trop élevé, etc.).
 */
export function classifyAnalysisCategory(categorie: string | undefined): {
  kind: MedicalResultKind;
  label: string;
} {
  const raw = (categorie ?? "").trim();
  const c = raw.toLowerCase();

  if (c === "correct" || c === "normal" || c === "ok") {
    return { kind: "normal", label: raw.length > 0 ? raw : "Dans la norme" };
  }

  if (c.includes("trop bas")) {
    return { kind: "low", label: raw.length > 0 ? raw : "Trop bas" };
  }

  if (c.includes("trop élevé") || c.includes("trop eleve")) {
    return { kind: "high", label: raw.length > 0 ? raw : "Trop élevé" };
  }

  if (c.includes("élevé") || c.includes("eleve") || c.includes("supérieur") || c.includes("superieur")) {
    return { kind: "high", label: raw.length > 0 ? raw : "Élevé" };
  }

  if (
    (c.includes("bas") || c.includes("faible") || c.includes("inférieur") || c.includes("inferieur")) &&
    !c.includes("élevé") &&
    !c.includes("eleve")
  ) {
    return { kind: "low", label: raw.length > 0 ? raw : "Bas" };
  }

  if (c === "abnormal") {
    return { kind: "attention", label: "Hors normes" };
  }

  return {
    kind: "attention",
    label: raw.length > 0 ? raw : "À interpréter avec prudence",
  };
}

function buildParsedMetrics(tauxRaw: string | undefined, intervalleRaw: string | undefined): ParsedLabMetrics | undefined {
  const measured = parseMeasuredValue(tauxRaw ?? "");
  const ref = parseReferenceRange(intervalleRaw ?? "");
  const unit = measured.unit ?? ref.unit;

  const valueNumeric = measured.numeric;
  const refLow = ref.low;
  const refHigh = ref.high;

  if (
    valueNumeric === null &&
    refLow === null &&
    refHigh === null &&
    unit === null
  ) {
    return undefined;
  }

  const rangePosition = inferRangePosition(valueNumeric, refLow, refHigh);
  const deviationPercent = deviationFromMidpoint(valueNumeric, refLow, refHigh);

  return {
    valueNumeric,
    refLow,
    refHigh,
    unit,
    rangePosition,
    deviationPercent,
  };
}

export function apiElementToMedicalResult(el: ApiElement, index: number): MedicalResult {
  const { kind, label } = classifyAnalysisCategory(el.categorie);
  const ui = KIND_UI[kind];
  const intervalle = el.intervalle?.trim();

  const parsed = buildParsedMetrics(el.taux, intervalle);

  return {
    id: index + 1,
    name: el.nom ?? "Analyse",
    value: el.taux ?? "—",
    referenceRange: intervalle && intervalle.length > 0 ? intervalle : "Non communiqué",
    categoryLabel: label,
    kind,
    status: kind === "normal" ? "normal" : "abnormal",
    resultIcon: ui.icon,
    color: ui.color,
    bgColor: ui.bgColor,
    statusColor: ui.statusColor,
    explanation: el.explication ?? "Aucune explication fournie par l’analyse automatique.",
    parsed,
  };
}
