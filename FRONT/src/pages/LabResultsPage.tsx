import { useState, useEffect } from "react";
import { Smile, Frown } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UiButton from "../components/UiButton";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import type { MedicalResult, AnalysisApiResult } from "../types";

export default function LabResultsPage() {
  const navigate = useNavigate();
  const [focusedResultId, setFocusedResultId] = useState<number | null>(null);
  const [results, setResults] = useState<MedicalResult[]>([]);
  useScrollAnimations();

  const normalCount   = results.filter((r) => r.status === "normal").length;
  const abnormalCount = results.length - normalCount;

  useEffect(() => {
    const stored = localStorage.getItem("analysisResult");
    if (!stored) return;

    const parsed = JSON.parse(stored) as AnalysisApiResult;
    const elements = parsed?.result?.elements ?? [];

    const mapped: MedicalResult[] = elements.map((el, index) => {
      const isNormal = el.categorie === "correct" || el.categorie === "normal";
      return {
        id:          index + 1,
        name:        el.nom  ?? "Analyse",
        value:       el.taux ?? "-",
        status:      isNormal ? "normal" : "abnormal",
        resultIcon:  isNormal ? <Smile /> : <Frown />,
        color:       isNormal ? "border-green-400" : "border-yellow-400",
        bgColor:     isNormal ? "bg-green-50"      : "bg-yellow-50",
        statusColor: isNormal ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800",
        explanation: el.explication ?? "Aucune explication fournie par l'analyse automatique.",
      };
    });

    setResults(mapped);
  }, []);

  const handlePDFExport = async (): Promise<void> => {
    try {
      const exportElement = document.createElement("div");
      Object.assign(exportElement.style, {
        position: "absolute", left: "-9999px",
        backgroundColor: "#ffffff", padding: "30px",
        width: "210mm", fontFamily: "Arial, sans-serif",
        lineHeight: "1.6", color: "#333333",
      });

      const title = document.createElement("h1");
      title.textContent = "Résultats Médicaux";
      Object.assign(title.style, {
        fontSize: "28px", fontWeight: "bold", marginBottom: "10px",
        color: "#1f2937", borderBottom: "3px solid #7c3aed", paddingBottom: "10px",
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
          marginBottom: "30px", padding: "15px",
          backgroundColor: "#f9fafb", borderRadius: "8px",
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
        fontSize: "20px", fontWeight: "bold",
        marginTop: "30px", marginBottom: "20px", color: "#1f2937",
      });
      exportElement.appendChild(detailsTitle);

      const mainContent = document.querySelector<HTMLElement>("#main-content");
      if (mainContent) {
        mainContent.querySelectorAll<HTMLElement>("article").forEach((article) => {
          const clone = article.cloneNode(true) as HTMLElement;
          Object.assign(clone.style, {
            marginBottom: "20px", padding: "20px",
            border: "1px solid #e5e7eb", borderRadius: "8px",
            pageBreakInside: "avoid", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          });
          const h3 = clone.querySelector<HTMLElement>("h3");
          if (h3) { h3.style.fontSize = "16px"; h3.style.marginBottom = "10px"; h3.style.color = "#1f2937"; }

          clone.querySelectorAll<HTMLElement>("p").forEach((p) => {
            if (p.textContent?.match(/^\d+(\.\d+)?$/)) {
              Object.assign(p.style, { fontSize: "28px", fontWeight: "bold", color: "#7c3aed" });
            }
          });
          clone.querySelectorAll<HTMLElement>("span").forEach((badge) => {
            const txt = badge.textContent ?? "";
            if (txt.includes("Normal") || txt.includes("Abnormal")) {
              Object.assign(badge.style, {
                display: "inline-block", padding: "8px 12px",
                borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
                backgroundColor: txt.includes("Normal") ? "#d1fae5" : "#fef3c7",
                color: txt.includes("Normal") ? "#065f46" : "#92400e",
              });
            }
          });
          clone.querySelectorAll<HTMLElement>("[class*='bg-']").forEach((exp) => {
            Object.assign(exp.style, { backgroundColor: "#f3f4f6", padding: "15px", borderRadius: "6px", marginTop: "15px", fontSize: "13px" });
          });
          exportElement.appendChild(clone);
        });
      }

      const footerEl = document.createElement("div");
      Object.assign(footerEl.style, { marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", fontSize: "11px", color: "#666666" });
      footerEl.innerHTML = `
        <p style="margin:5px 0"><strong>Avis Important:</strong> Ce document est à titre informatif uniquement.</p>
        <p style="margin:5px 0">Consultez toujours un professionnel de santé pour interpréter vos résultats.</p>
      `;
      exportElement.appendChild(footerEl);
      document.body.appendChild(exportElement);

      const canvas = await html2canvas(exportElement, {
        scale: 2, useCORS: true, logging: false,
        backgroundColor: "#ffffff", allowTaint: true,
        ignoreElements: (element) => element.tagName === "SCRIPT" || element.tagName === "STYLE",
      });
      document.body.removeChild(exportElement);

      const imgData   = canvas.toDataURL("image/png");
      const pdf       = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth  = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft  = imgHeight;
      let position    = 0;

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
            <a
              href="/help"
              className="px-6 py-2 bg-raspberry-600 text-white rounded-full font-semibold hover:bg-raspberry-500 focus:outline-none focus:ring-2 focus:ring-raspberry-400 focus:ring-offset-2 transition"
              aria-label="Aide"
            >
              Help
            </a>
          </div>

          <section data-animate data-animate-variant="fade-up" className="p-6 mb-6" aria-label="Résumé des résultats">
            <div className="flex items-start gap-3 mb-4">
              <button
                onClick={() => navigate("/help")}
                className="w-8 h-8 bg-raspberry-600 rounded-xl flex items-center justify-center text-white text-lg focus:outline-none focus:ring-2 focus:ring-raspberry-400 focus:ring-offset-2 transition"
                aria-label="Accéder à l'aide médicale"
              >
                🏥
              </button>
              <div className="flex-1">
                <h1 className="font-bold text-gray-900 text-2xl">Vos Résultats</h1>
              </div>
            </div>

            <div className="space-y-3" role="region" aria-label="Résumé du statut des résultats">
              {normalCount > 0 && (
                <div className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-lg" role="status" tabIndex={0} aria-label={`${normalCount} valeur(s) normale(s)`}>
                  <span className="mt-0.5" aria-hidden="true">✅</span>
                  <span className="text-sm">{normalCount} valeur{normalCount > 1 ? "s" : ""} normale{normalCount > 1 ? "s" : ""}.</span>
                </div>
              )}
              {abnormalCount > 0 && (
                <div className="flex items-start gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg" role="status" tabIndex={0} aria-label={`${abnormalCount} valeur(s) à surveiller`}>
                  <span className="mt-0.5" aria-hidden="true">⚠️</span>
                  <span className="text-sm">{abnormalCount} valeur{abnormalCount > 1 ? "s" : ""} à surveiller. Consultez un professionnel de santé.</span>
                </div>
              )}
            </div>
          </section>

          <main id="main-content" className="space-y-4" data-animate-group>
            {results.length === 0 && (
              <p className="text-gray-600 text-sm">Aucun résultat détecté automatiquement dans ce document.</p>
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
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{result.name}</h3>
                      <div className="flex items-center">
                        <p className="text-3xl font-bold text-gray-900 mt-1">{result.value}</p>
                        <div className="mx-4" role="img">{result.resultIcon}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${result.statusColor}`}>
                      {result.status === "normal" ? "✓ Normal" : "⚠ À surveiller"}
                    </span>
                  </div>
                  <div className={`${result.bgColor} p-4 rounded-lg`}>
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">Interprétation :</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
                  </div>
                </div>
              </article>
            ))}
          </main>

          <nav data-animate data-animate-variant="fade-up" className="flex flex-wrap gap-4 mt-8" aria-label="Navigation des résultats">
            <UiButton bg="white" text="raspberry">
              <a href="/" className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded px-2 py-1">
                ← Retour à l'accueil
              </a>
            </UiButton>
            <UiButton bg="raspberry" text="white" onClick={() => void handlePDFExport()} aria-label="Exporter les résultats en PDF">
              ↓ Export en PDF
            </UiButton>
          </nav>
        </div>
      </div>
      <Footer />
    </div>
  );
}
