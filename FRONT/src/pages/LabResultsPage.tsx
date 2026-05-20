import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UiButton from "../components/UiButton";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import { apiElementToMedicalResult } from "../lib/analysisResultUi";
import type { MedicalResult, AnalysisApiResult } from "../types";

export default function LabResultsPage(): JSX.Element {
  const [focusedResultId, setFocusedResultId] = useState<number | null>(null);
  const [results, setResults] = useState<MedicalResult[]>([]);
  const [warning, setWarning] = useState<string>("");
  useScrollAnimations();

  const normalCount = results.filter((r) => r.kind === "normal").length;
  const lowCount = results.filter((r) => r.kind === "low").length;
  const highCount = results.filter((r) => r.kind === "high").length;
  const attentionCount = results.filter((r) => r.kind === "attention").length;

  useEffect(() => {
    const stored = localStorage.getItem("analysisResult");
    if (!stored) return;

    const parsed = JSON.parse(stored) as AnalysisApiResult;
    const elements = parsed?.result?.elements ?? [];
    setWarning(typeof parsed?.result?.warning === "string" ? parsed.result.warning : "");

    const mapped: MedicalResult[] = elements.map((el, index) =>
      apiElementToMedicalResult(el, index),
    );
    setResults(mapped);
  }, []);

  const handlePDFExport = async (): Promise<void> => {
    try {
      const exportElement = document.createElement("div");
      Object.assign(exportElement.style, {
        position: "absolute",
        left: "-9999px",
        backgroundColor: "#ffffff",
        padding: "30px",
        width: "210mm",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333333",
      });

      const title = document.createElement("h1");
      title.textContent = "Résultats Médicaux";
      Object.assign(title.style, {
        fontSize: "28px",
        fontWeight: "bold",
        marginBottom: "10px",
        color: "#1f2937",
        borderBottom: "3px solid #7c3aed",
        paddingBottom: "10px",
      });
      exportElement.appendChild(title);

      const dateEl = document.createElement("p");
      dateEl.textContent = `Date d'export: ${new Date().toLocaleDateString("fr-FR")}`;
      Object.assign(dateEl.style, { marginBottom: "30px", fontSize: "13px", color: "#666666" });
      exportElement.appendChild(dateEl);

      const resultsSection = document.querySelector<HTMLElement>("[aria-label='Résumé des résultats']");
      if (resultsSection) {
        const summaryClone = resultsSection.cloneNode(true) as HTMLElement;
        Object.assign(summaryClone.style, {
          marginBottom: "30px",
          padding: "15px",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        });
        const summaryTitle = summaryClone.querySelector<HTMLElement>("h1");
        if (summaryTitle) {
          summaryTitle.style.fontSize = "18px";
          summaryTitle.style.marginBottom = "15px";
        }
        exportElement.appendChild(summaryClone);
      }

      const detailsTitle = document.createElement("h2");
      detailsTitle.textContent = "Résultats Détaillés";
      Object.assign(detailsTitle.style, {
        fontSize: "20px",
        fontWeight: "bold",
        marginTop: "30px",
        marginBottom: "20px",
        color: "#1f2937",
      });
      exportElement.appendChild(detailsTitle);

      const mainContent = document.querySelector<HTMLElement>("#main-content");
      if (mainContent) {
        mainContent.querySelectorAll<HTMLElement>("article").forEach((article) => {
          const clone = article.cloneNode(true) as HTMLElement;
          Object.assign(clone.style, {
            marginBottom: "20px",
            padding: "20px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            pageBreakInside: "avoid",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          });
          const h3 = clone.querySelector<HTMLElement>("h3");
          if (h3) {
            h3.style.fontSize = "16px";
            h3.style.marginBottom = "10px";
            h3.style.color = "#1f2937";
          }
          clone.querySelectorAll<HTMLElement>("dd.result-value-large").forEach((dd) => {
            Object.assign(dd.style, { fontSize: "22px", fontWeight: "bold", color: "#1f2937" });
          });
          exportElement.appendChild(clone);
        });
      }

      const footerEl = document.createElement("div");
      Object.assign(footerEl.style, {
        marginTop: "40px",
        paddingTop: "20px",
        borderTop: "1px solid #e5e7eb",
        fontSize: "11px",
        color: "#666666",
      });
      footerEl.innerHTML = `
        <p style="margin:5px 0"><strong>Avis Important:</strong> Ce document est à titre informatif uniquement.</p>
        <p style="margin:5px 0">Consultez toujours un professionnel de santé pour interpréter vos résultats.</p>
      `;
      exportElement.appendChild(footerEl);
      document.body.appendChild(exportElement);

      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        ignoreElements: (element) => element.tagName === "SCRIPT" || element.tagName === "STYLE",
        onclone: (clonedDoc) => {
          // html2canvas 1.4 ne supporte pas oklch (Tailwind v4) — on retire les stylesheets
          // du doc cloné ; l'exportElement utilise uniquement des styles inline.
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
          const safe = clonedDoc.createElement("style");
          safe.textContent = "* { box-sizing: border-box; }";
          clonedDoc.head.appendChild(safe);
        },
      });
      document.body.removeChild(exportElement);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("Resultats_Medicaux.pdf");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Erreur lors de l'export PDF:", msg);
      alert("Erreur lors de l'export PDF: " + msg);
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
    <div className="w-screen min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100">
      <Header />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="w-full h-full">
          <div className="mt-24 flex justify-end">
            <Link
              to="/help"
              className="px-6 py-2 bg-raspberry-600 text-white rounded-full font-semibold hover:bg-raspberry-500 focus:outline-none focus:ring-2 focus:ring-raspberry-400 focus:ring-offset-2 transition"
            >
              Aide
            </Link>
          </div>

          <section data-animate data-animate-variant="fade-up" className="p-6 mb-6" aria-label="Résumé des résultats">
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
                  aria-label={`${normalCount} valeur(s) dans la norme`}
                >
                  <span className="mt-0.5" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-sm">
                    <strong>{normalCount}</strong> paramètre{normalCount > 1 ? "s" : ""} dans la norme de référence.
                  </span>
                </div>
              )}
              {lowCount > 0 && (
                <div
                  className="flex items-start gap-2 text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-100"
                  role="status"
                  aria-label={`${lowCount} valeur(s) trop basses`}
                >
                  <span className="mt-0.5" aria-hidden="true">
                    ↓
                  </span>
                  <span className="text-sm">
                    <strong>{lowCount}</strong> résultat{lowCount > 1 ? "s" : ""} sous la référence (trop bas). À
                    interpréter avec un professionnel de santé.
                  </span>
                </div>
              )}
              {highCount > 0 && (
                <div
                  className="flex items-start gap-2 text-orange-900 bg-orange-50 p-3 rounded-lg border border-orange-100"
                  role="status"
                  aria-label={`${highCount} valeur(s) trop élevées`}
                >
                  <span className="mt-0.5" aria-hidden="true">
                    ↑
                  </span>
                  <span className="text-sm">
                    <strong>{highCount}</strong> résultat{highCount > 1 ? "s" : ""} au-dessus de la référence (trop
                    élevé). À faire suivre médicalement si besoin.
                  </span>
                </div>
              )}
              {attentionCount > 0 && (
                <div
                  className="flex items-start gap-2 text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-100"
                  role="status"
                  aria-label={`${attentionCount} valeur(s) à surveiller`}
                >
                  <span className="mt-0.5" aria-hidden="true">
                    ⚠
                  </span>
                  <span className="text-sm">
                    <strong>{attentionCount}</strong> mesure{attentionCount > 1 ? "s" : ""} hors normes ou à préciser —
                    à surveiller avec votre médecin ou votre biologiste.
                  </span>
                </div>
              )}
            </div>
          </section>

          <main id="main-content" className="space-y-4" data-animate-group>
            {results.length === 0 && (
              <p className="text-gray-600 text-sm">
                Aucun résultat détecté automatiquement dans ce document.
              </p>
            )}
            {results.map((result) => (
              <article
                key={result.id}
                data-animate-child
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
                          <dt className="text-gray-500 font-medium">Valeur mesurée</dt>
                          <dd className="result-value-large mt-1 text-2xl font-bold text-gray-900 tracking-tight">
                            {result.value}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Intervalle de référence</dt>
                          <dd className="mt-1 text-gray-800">{result.referenceRange}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500 font-medium">Catégorie (API)</dt>
                          <dd className="mt-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${result.statusColor}`}>
                              {result.categoryLabel}
                            </span>
                          </dd>
                        </div>
                      </dl>
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
            <UiButton bg="raspberry" text="white" type="button" onClick={() => void handlePDFExport()}>
              Export en PDF
            </UiButton>
          </nav>
        </div>
      </div>
      <Footer />
    </div>
  );
}
