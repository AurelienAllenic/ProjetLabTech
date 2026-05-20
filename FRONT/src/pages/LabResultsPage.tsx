import { useState, useEffect, type ReactElement } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UiButton from "../components/UiButton";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import ParameterReferenceChart from "../components/ParameterReferenceChart";
import ResultsDeviationBars from "../components/ResultsDeviationBars";
import ResultsDistributionPie from "../components/ResultsDistributionPie";
import { apiElementToMedicalResult } from "../lib/analysisResultUi";
import { formatLabNumber } from "../lib/labValueParse";
import { exportLabResultsToPdf } from "../lib/pdfLabResultsExport";
import type { MedicalResult, AnalysisApiResult, ParsedRangePosition, MedicalResultKind } from "../types";

function labelForParsedPosition(p: ParsedRangePosition): string {
  switch (p) {
    case "below":
      return "Sous l’intervalle de référence (valeurs extraites)";
    case "above":
      return "Au-dessus de l’intervalle de référence (valeurs extraites)";
    case "within":
      return "Comprise dans l’intervalle de référence (valeurs extraites)";
    default:
      return "Mesure ou intervalle non entièrement lisibles en nombre — se fier au texte brut du laboratoire";
  }
}

/** Lignes « nom du marqueur — valeur mesurée » pour une catégorie. */
function analysisEntriesLines(results: MedicalResult[], kind: MedicalResultKind): string[] {
  return results.filter((r) => r.kind === kind).map((r) => `${r.name} — ${r.value}`);
}

export default function LabResultsPage(): JSX.Element {
  const [focusedResultId, setFocusedResultId] = useState<number | null>(null);
  const [results, setResults] = useState<MedicalResult[]>([]);
  const [warning, setWarning] = useState<string>("");
  const [conclusion, setConclusion] = useState<string>("");
  const [pdfExportLoading, setPdfExportLoading] = useState(false);
  const [pdfExportPhase, setPdfExportPhase] = useState("");
  useScrollAnimations();

  const normalCount = results.filter((r) => r.kind === "normal").length;
  const lowCount = results.filter((r) => r.kind === "low").length;
  const highCount = results.filter((r) => r.kind === "high").length;
  const attentionCount = results.filter((r) => r.kind === "attention").length;

  const pieSlices = [
    {
      key: "normal",
      name: "Dans la norme",
      value: normalCount,
      fill: "#16a34a",
      entries: analysisEntriesLines(results, "normal"),
    },
    {
      key: "low",
      name: "Trop bas",
      value: lowCount,
      fill: "#2563eb",
      entries: analysisEntriesLines(results, "low"),
    },
    {
      key: "high",
      name: "Trop élevé",
      value: highCount,
      fill: "#ea580c",
      entries: analysisEntriesLines(results, "high"),
    },
    {
      key: "attention",
      name: "À préciser / hors normes",
      value: attentionCount,
      fill: "#ca8a04",
      entries: analysisEntriesLines(results, "attention"),
    },
  ];

  const pieAriaSummary =
    results.length === 0
      ? "Aucune donnée à afficher."
      : [
          normalCount > 0 ? `Dans la norme : ${analysisEntriesLines(results, "normal").join(", ")}` : null,
          lowCount > 0 ? `Trop bas : ${analysisEntriesLines(results, "low").join(", ")}` : null,
          highCount > 0 ? `Trop élevé : ${analysisEntriesLines(results, "high").join(", ")}` : null,
          attentionCount > 0
            ? `À préciser ou hors normes : ${analysisEntriesLines(results, "attention").join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join(". ");

  useEffect(() => {
    const stored = localStorage.getItem("analysisResult");
    if (!stored) return;

    const parsed = JSON.parse(stored) as AnalysisApiResult;
    const elements = parsed?.result?.elements ?? [];
    setWarning(typeof parsed?.result?.warning === "string" ? parsed.result.warning : "");
    setConclusion(typeof parsed?.result?.conclusion === "string" ? parsed.result.conclusion.trim() : "");

    const mapped: MedicalResult[] = elements.map((el, index) =>
      apiElementToMedicalResult(el, index),
    );
    setResults(mapped);
  }, []);

  useEffect(() => {
    if (!pdfExportLoading) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pdfExportLoading]);

  const handlePDFExport = async (): Promise<void> => {
    setPdfExportLoading(true);
    setPdfExportPhase("Préparation du PDF…");
    try {
      await exportLabResultsToPdf({
        onProgress: (current, total) => {
          setPdfExportPhase(`Capture de la partie ${current} sur ${total}…`);
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Erreur lors de l'export PDF:", msg);
      alert("Erreur lors de l'export PDF: " + msg);
    } finally {
      setPdfExportLoading(false);
      setPdfExportPhase("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, resultId: number): void => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const ids = results.map((r) => r.id);
    const idx = ids.indexOf(resultId);
    const nextIdx = e.key === "ArrowDown" ? idx + 1 : idx - 1;
    if (nextIdx >= 0 && nextIdx < ids.length) {
      document.querySelector<HTMLElement>(`[data-result-id="${ids[nextIdx]}"]`)?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-linear-to-br from-blue-50 via-white to-blue-100">
      <Header />

      <div className="max-w-4xl mx-auto min-w-0 w-full px-6 py-6 space-y-6 box-border">
        <div className="w-full min-w-0">
          <div className="mt-24 flex justify-end">
            <Link
              to="/help"
              className="px-6 py-2 bg-raspberry-600 text-white rounded-full font-semibold hover:bg-raspberry-500 focus:outline-none focus:ring-2 focus:ring-raspberry-400 focus:ring-offset-2 transition"
            >
              Aide
            </Link>
          </div>

          <section
            data-animate
            data-animate-once
            data-animate-variant="fade-up"
            className="p-6 mb-6"
            aria-label="Résumé des résultats"
          >
            <div data-pdf-segment="summary-copy">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1">
                  <h1 className="font-bold text-gray-900 text-2xl">Vos résultats</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Synthèse issue de l&apos;analyse : valeur mesurée, intervalle de référence et interprétation.
                  </p>
                </div>
              </div>

              {warning ? (
                <div
                  role="status"
                  className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                >
                  {warning}
                </div>
              ) : null}

              <div className="space-y-3" role="region" aria-label="Résumé du statut des résultats">
              {normalCount > 0 && (
                <div
                  className="flex items-start gap-2 text-green-800 bg-green-50 p-3 rounded-lg border border-green-100"
                  role="status"
                  aria-label={`Dans la norme : ${analysisEntriesLines(results, "normal").join(", ")}`}
                >
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ✓
                  </span>
                  <div className="text-sm min-w-0">
                    <p className="font-semibold text-green-900">Dans la norme de référence</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-green-900/95">
                      {results
                        .filter((r) => r.kind === "normal")
                        .map((r) => (
                          <li key={r.id}>
                            <strong>{r.name}</strong>
                            <span className="tabular-nums"> — {r.value}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
              {lowCount > 0 && (
                <div
                  className="flex items-start gap-2 text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-100"
                  role="status"
                  aria-label={`Trop bas : ${analysisEntriesLines(results, "low").join(", ")}`}
                >
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ↓
                  </span>
                  <div className="text-sm min-w-0">
                    <p className="font-semibold text-blue-950">
                      Sous la référence (trop bas) — à interpréter avec un professionnel de santé
                    </p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {results
                        .filter((r) => r.kind === "low")
                        .map((r) => (
                          <li key={r.id}>
                            <strong>{r.name}</strong>
                            <span className="tabular-nums"> — {r.value}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
              {highCount > 0 && (
                <div
                  className="flex items-start gap-2 text-orange-900 bg-orange-50 p-3 rounded-lg border border-orange-100"
                  role="status"
                  aria-label={`Trop élevé : ${analysisEntriesLines(results, "high").join(", ")}`}
                >
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ↑
                  </span>
                  <div className="text-sm min-w-0">
                    <p className="font-semibold text-orange-950">
                      Au-dessus de la référence (trop élevé) — à faire suivre médicalement si besoin
                    </p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {results
                        .filter((r) => r.kind === "high")
                        .map((r) => (
                          <li key={r.id}>
                            <strong>{r.name}</strong>
                            <span className="tabular-nums"> — {r.value}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
              {attentionCount > 0 && (
                <div
                  className="flex items-start gap-2 text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-100"
                  role="status"
                  aria-label={`À préciser : ${analysisEntriesLines(results, "attention").join(", ")}`}
                >
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    ⚠
                  </span>
                  <div className="text-sm min-w-0">
                    <p className="font-semibold text-amber-950">
                      Hors normes ou à préciser — à surveiller avec votre médecin ou votre biologiste
                    </p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {results
                        .filter((r) => r.kind === "attention")
                        .map((r) => (
                          <li key={r.id}>
                            <strong>{r.name}</strong>
                            <span className="tabular-nums"> — {r.value}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            </div>

            {conclusion ? (
              <div
                data-pdf-segment="conclusion"
                className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                role="region"
                aria-labelledby="analysis-conclusion-heading"
              >
                <h2 id="analysis-conclusion-heading" className="text-base font-semibold text-gray-900">
                  Conclusion de l&apos;analyse
                </h2>
                <p className="mt-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{conclusion}</p>
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  Ce texte est fourni à titre informatif uniquement ; il ne constitue pas un diagnostic médical.
                  Pour une interprétation fiable et toute décision de santé, adressez-vous à votre médecin ou à votre
                  biologiste.
                </p>
              </div>
            ) : null}

            {results.length > 0 ? (
              <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
                <div data-pdf-segment="chart-bars-block" className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Synthèse visuelle et précision</h2>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      Les graphiques utilisent les <strong>nombres détectés</strong> dans les champs valeur et intervalle.
                      Si le format du compte-rendu est atypique, la partie textuelle du laboratoire reste la référence.
                    </p>
                  </div>
                  <ResultsDeviationBars results={results} />
                </div>
                <div
                  data-pdf-segment="chart-pie-block"
                  className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-base font-semibold text-gray-900 mb-2 text-center lg:text-left">
                    Répartition par statut
                  </h2>
                  <ResultsDistributionPie slices={pieSlices} ariaSummary={pieAriaSummary} />
                </div>
              </div>
            ) : null}
          </section>

          <main id="main-content" className="space-y-4">
            {results.length === 0 && (
              <p className="text-gray-600 text-sm">
                Aucun résultat détecté automatiquement dans ce document.
              </p>
            )}
            {results.map((result) => (
              <article
                key={result.id}
                tabIndex={0}
                data-result-id={result.id}
                onKeyDown={(e) => handleKeyDown(e, result.id)}
                onFocus={() => setFocusedResultId(result.id)}
                onBlur={() => setFocusedResultId(null)}
                className={`border-l-4 ${result.color} bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition ${
                  focusedResultId === result.id ? "ring-2 ring-raspberry-400 ring-offset-2" : ""
                }`}
                role="region"
                aria-label={`Résultat: ${result.name}`}
              >
                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{result.name}</h3>
                      <dl className="mt-3 grid gap-3 text-sm">
                        <div>
                          <dt className="text-gray-500 font-medium">Valeur mesurée (texte laboratoire)</dt>
                          <dd className="result-value-large mt-1 text-2xl font-bold text-gray-900 tracking-tight">
                            {result.value}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Intervalle de référence</dt>
                          <dd className="mt-1 text-gray-800">{result.referenceRange}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Statut interprété</dt>
                          <dd className="mt-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${result.statusColor}`}>
                              {result.categoryLabel}
                            </span>
                          </dd>
                        </div>
                      </dl>

                      {result.parsed ? (
                        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/90 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
                            Synthèse numérique (extraction automatique)
                          </h4>
                          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                            {result.parsed.valueNumeric !== null ? (
                              <div>
                                <dt className="text-gray-500 font-medium">Valeur extraite</dt>
                                <dd className="mt-1 font-semibold text-gray-900 tabular-nums">
                                  {formatLabNumber(result.parsed.valueNumeric)}
                                  {result.parsed.unit ? ` ${result.parsed.unit}` : ""}
                                </dd>
                              </div>
                            ) : null}
                            {result.parsed.refLow !== null && result.parsed.refHigh !== null ? (
                              <div>
                                <dt className="text-gray-500 font-medium">Bornes extraites</dt>
                                <dd className="mt-1 font-semibold text-gray-900 tabular-nums">
                                  {formatLabNumber(result.parsed.refLow)} — {formatLabNumber(result.parsed.refHigh)}
                                  {result.parsed.unit ? ` ${result.parsed.unit}` : ""}
                                </dd>
                              </div>
                            ) : null}
                            <div className="sm:col-span-2">
                              <dt className="text-gray-500 font-medium">Position par rapport à la référence</dt>
                              <dd className="mt-1 text-gray-900">{labelForParsedPosition(result.parsed.rangePosition)}</dd>
                            </div>
                            {result.parsed.deviationPercent != null ? (
                              <div className="sm:col-span-2">
                                <dt className="text-gray-500 font-medium">Écart au centre de la référence</dt>
                                <dd className="mt-1 font-medium text-gray-900 tabular-nums">
                                  {result.parsed.deviationPercent > 0 ? "+" : ""}
                                  {result.parsed.deviationPercent.toFixed(1)} %
                                  <span className="text-gray-500 font-normal text-xs ml-2">
                                    (0 % = milieu de l&apos;intervalle ; −100 % / +100 % ≈ bornes basse et haute)
                                  </span>
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        </div>
                      ) : null}

                      {result.parsed?.valueNumeric != null &&
                      result.parsed.refLow != null &&
                      result.parsed.refHigh != null ? (
                        <div data-pdf-segment="parameter-chart" className="mt-4">
                          <ParameterReferenceChart
                            name={result.name}
                            valueNumeric={result.parsed.valueNumeric}
                            refLow={result.parsed.refLow}
                            refHigh={result.parsed.refHigh}
                            unit={result.parsed.unit}
                          />
                        </div>
                      ) : null}
                    </div>
                    <span className="shrink-0 flex items-start justify-center sm:pt-1" aria-hidden="true">
                      {result.resultIcon}
                    </span>
                  </div>
                  <div className={`${result.bgColor} p-4 rounded-lg mt-4 border border-black/5`}>
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Interprétation</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
                  </div>
                </div>
              </article>
            ))}
          </main>

          <nav
            className="flex flex-wrap gap-4 mt-8"
            aria-label="Navigation des résultats"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-400 bg-white hover:bg-raspberry-50 border border-raspberry-300 text-raspberry-700"
            >
              ← Retour à l&apos;accueil
            </Link>
            <UiButton
              bg="raspberry"
              text="white"
              type="button"
              disabled={pdfExportLoading}
              aria-busy={pdfExportLoading}
              onClick={() => void handlePDFExport()}
            >
              {pdfExportLoading ? "Génération du PDF…" : "Export en PDF"}
            </UiButton>
          </nav>
        </div>
      </div>
      <Footer />

      {pdfExportLoading ? (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/45 px-4 motion-safe:backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Génération du PDF en cours"
        >
          <div className="max-w-sm rounded-2xl border border-gray-200 bg-white px-8 py-7 text-center shadow-xl">
            <div
              className="mx-auto mb-5 h-11 w-11 rounded-full border-[3px] border-raspberry-100 border-t-raspberry-600 motion-safe:animate-spin"
              aria-hidden="true"
            />
            <p id="pdf-export-phase" className="text-base font-semibold text-gray-900">
              {pdfExportPhase || "Génération du PDF…"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Patientez quelques instants : chaque bloc de la page est capturé pour garantir une mise en page fidèle.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
