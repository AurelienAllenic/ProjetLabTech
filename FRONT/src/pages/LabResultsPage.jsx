import React, { useState, useEffect } from "react";
import UiButton from "../components/UiButton";
import { Smile, Frown, Meh } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function LabResultsPage() {
  const navigate = useNavigate();
  const [focusedResultId, setFocusedResultId] = useState(null);
  useScrollAnimations();


  const [results, setResults] = useState([]);

  
const normalCount = results.filter(r => r.status === "normal").length;
const abnormalCount = results.length - normalCount;


  useEffect(() => {
  const stored = localStorage.getItem("analysisResult");
  if (!stored) return;

  const parsed = JSON.parse(stored);
  const elements = parsed?.result?.elements || [];

  const mapped = elements.map((el, index) => {
    const isNormal =
      el.categorie === "correct" || el.categorie === "normal";

    return {
      id: index + 1,
      name: el.nom || "Analyse",
      value: el.taux || "-",
      status: isNormal ? "normal" : "abnormal",
      resultIcon: isNormal ? <Smile /> : <Frown />,
      color: isNormal ? "border-green-400" : "border-yellow-400",
      bgColor: isNormal ? "bg-green-50" : "bg-yellow-50",
      statusColor: isNormal
        ? "bg-green-100 text-green-800"
        : "bg-yellow-100 text-yellow-800",
      explanation:
        el.explication ||
        "Aucune explication fournie par l’analyse automatique.",
    };
  });

  setResults(mapped);
}, []);


  const handlePDFExport = async () => {
    try {
      // Créer un élément temporaire pour l'export
      const exportElement = document.createElement("div");
      exportElement.style.position = "absolute";
      exportElement.style.left = "-9999px";
      exportElement.style.backgroundColor = "#ffffff";
      exportElement.style.padding = "30px";
      exportElement.style.width = "210mm";
      exportElement.style.fontFamily = "Arial, sans-serif";
      exportElement.style.lineHeight = "1.6";
      exportElement.style.color = "#333333";
      
      // Créer un titre
      const title = document.createElement("h1");
      title.textContent = "Résultats Médicaux";
      title.style.fontSize = "28px";
      title.style.fontWeight = "bold";
      title.style.marginBottom = "10px";
      title.style.color = "#1f2937";
      title.style.borderBottom = "3px solid #7c3aed";
      title.style.paddingBottom = "10px";
      exportElement.appendChild(title);
      
      // Ajouter la date
      const dateElement = document.createElement("p");
      dateElement.textContent = `Date d'export: ${new Date().toLocaleDateString("fr-FR")}`;
      dateElement.style.marginBottom = "30px";
      dateElement.style.fontSize = "13px";
      dateElement.style.color = "#666666";
      exportElement.appendChild(dateElement);
      
      // Copier la section résumé
      const resultsSection = document.querySelector("[aria-label='Résumé des résultats']");
      if (resultsSection) {
        const summaryClone = resultsSection.cloneNode(true);
        // Ajouter du style au résumé
        summaryClone.style.marginBottom = "30px";
        summaryClone.style.padding = "15px";
        summaryClone.style.backgroundColor = "#f9fafb";
        summaryClone.style.borderRadius = "8px";
        
        const summaryTitle = summaryClone.querySelector("h1");
        if (summaryTitle) {
          summaryTitle.style.fontSize = "18px";
          summaryTitle.style.marginBottom = "15px";
        }
        
        exportElement.appendChild(summaryClone);
      }
      
      // Ajouter un titre pour les résultats détaillés
      const detailsTitle = document.createElement("h2");
      detailsTitle.textContent = "Résultats Détaillés";
      detailsTitle.style.fontSize = "20px";
      detailsTitle.style.fontWeight = "bold";
      detailsTitle.style.marginTop = "30px";
      detailsTitle.style.marginBottom = "20px";
      detailsTitle.style.color = "#1f2937";
      exportElement.appendChild(detailsTitle);
      
      // Copier les cartes de résultats avec meilleure mise en forme
      const mainContent = document.querySelector("#main-content");
      if (mainContent) {
        const articles = mainContent.querySelectorAll("article");
        articles.forEach((article) => {
          const articleClone = article.cloneNode(true);
          
          // Appliquer des styles personnalisés
          articleClone.style.marginBottom = "20px";
          articleClone.style.padding = "20px";
          articleClone.style.border = "1px solid #e5e7eb";
          articleClone.style.borderRadius = "8px";
          articleClone.style.pageBreakInside = "avoid";
          articleClone.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
          
          // Styliser les en-têtes des résultats
          const h3 = articleClone.querySelector("h3");
          if (h3) {
            h3.style.fontSize = "16px";
            h3.style.marginBottom = "10px";
            h3.style.color = "#1f2937";
          }
          
          // Styliser les valeurs
          const values = articleClone.querySelectorAll("p");
          values.forEach((p) => {
            if (p.textContent.match(/^\d+(\.\d+)?$/)) {
              p.style.fontSize = "28px";
              p.style.fontWeight = "bold";
              p.style.color = "#7c3aed";
            }
          });
          
          // Styliser les badges de statut
          const badges = articleClone.querySelectorAll("span");
          badges.forEach((badge) => {
            if (badge.textContent.includes("Normal") || badge.textContent.includes("Abnormal")) {
              badge.style.display = "inline-block";
              badge.style.padding = "8px 12px";
              badge.style.borderRadius = "20px";
              badge.style.fontSize = "12px";
              badge.style.fontWeight = "bold";
              
              if (badge.textContent.includes("Normal")) {
                badge.style.backgroundColor = "#d1fae5";
                badge.style.color = "#065f46";
              } else {
                badge.style.backgroundColor = "#fef3c7";
                badge.style.color = "#92400e";
              }
            }
          });
          
          // Styliser les explications
          const explanations = articleClone.querySelectorAll("[class*='bg-']");
          explanations.forEach((exp) => {
            exp.style.backgroundColor = "#f3f4f6";
            exp.style.padding = "15px";
            exp.style.borderRadius = "6px";
            exp.style.marginTop = "15px";
            exp.style.fontSize = "13px";
          });
          
          exportElement.appendChild(articleClone);
        });
      }
      
      // Ajouter un pied de page
      const footer = document.createElement("div");
      footer.style.marginTop = "40px";
      footer.style.paddingTop = "20px";
      footer.style.borderTop = "1px solid #e5e7eb";
      footer.style.fontSize = "11px";
      footer.style.color = "#666666";
      footer.innerHTML = `
        <p style="margin: 5px 0;"><strong>Avis Important:</strong> Ce document à titre informatif uniquement.</p>
        <p style="margin: 5px 0;">Il ne remplace pas un avis médical professionnel.</p>
        <p style="margin: 5px 0;">Consultez toujours un professionnel de santé pour interpréter vos résultats.</p>
      `;
      exportElement.appendChild(footer);
      
      document.body.appendChild(exportElement);

      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        ignoreElements: (element) => {
          return element.tagName === "SCRIPT" || element.tagName === "STYLE";
        },
      });

      document.body.removeChild(exportElement);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // Width of A4 in mm
      const pageHeight = 297; // Height of A4 in mm
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
      console.error("Erreur lors de l'export PDF:", error);
      alert("Erreur lors de l'export PDF: " + error.message);
    }
  };

  const handleKeyDown = (e, resultId) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const resultIds = [1, 2, 3];
      const currentIndex = resultIds.indexOf(resultId);
      if (e.key === "ArrowDown" && currentIndex < resultIds.length - 1) {
        const nextButton = document.querySelector(
          `[data-result-id="${resultIds[currentIndex + 1]}"]`,
        );
        nextButton?.focus();
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        const prevButton = document.querySelector(
          `[data-result-id="${resultIds[currentIndex - 1]}"]`,
        );
        prevButton?.focus();
      }
    }
  };


  return (
    <div className="w-screen min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100">
          <Header />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="w-full h-full">
          {/* Header */}

          {/* New Analysis Button */}
          <div className="mt-24 flex justify-end">
            <a
              href="/help"
              className="px-6 py-2 bg-raspberry-600 text-white rounded-full font-semibold hover:bg-raspberry-500 focus:outline-none focus:ring-2 focus:ring-raspberry-400 focus:ring-offset-2 transition"
              aria-label="Aide"
            >
              Help
            </a>
          </div>

          {/* Results Summary */}
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
      <h1 className="font-bold text-gray-900 text-2xl">
        Vos Résultats
      </h1>
    </div>
  </div>

  <div
    className="space-y-3"
    role="region"
    aria-label="Résumé du statut des résultats"
  >
    {normalCount > 0 && (
      <div
        className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-lg"
        role="status"
        tabIndex={0}
        aria-label={`${normalCount} valeur(s) normale(s)`}
      >
        <span className="mt-0.5" aria-hidden="true">✅</span>
        <span className="text-sm">
          {normalCount} valeur{normalCount > 1 ? "s" : ""} normale{normalCount > 1 ? "s" : ""}.
        </span>
      </div>
    )}

    {abnormalCount > 0 && (
      <div
        className="flex items-start gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg"
        role="status"
        tabIndex={0}
        aria-label={`${abnormalCount} valeur(s) à surveiller`}
      >
        <span className="mt-0.5" aria-hidden="true">⚠️</span>
        <span className="text-sm">
          {abnormalCount} valeur{abnormalCount > 1 ? "s" : ""} à surveiller. Consultez un professionnel de santé pour interprétation.
        </span>
      </div>
    )}
  </div>
</section>


          {/* Results Cards */}
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
        focusedResultId === result.id
          ? "ring-2 ring-raspberry-400 ring-offset-2"
          : ""
      }`}
      role="region"
      aria-label={`Résultat: ${result.name}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {result.name}
            </h3>
            <div className="flex items-center">
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {result.value}
              </p>
              <div className="mx-4" role="img">
                {result.resultIcon}
              </div>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${result.statusColor}`}
          >
            {result.status === "normal" ? "✓ Normal" : "⚠ À surveiller"}
          </span>
        </div>

        <div className={`${result.bgColor} p-4 rounded-lg`}>
          <h4 className="font-semibold text-gray-900 text-sm mb-2">
            Interprétation :
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {result.explanation}
          </p>
        </div>
      </div>
    </article>
  ))}
</main>


          {/* Footer Buttons */}
          <nav
            data-animate data-animate-variant="fade-up"
            className="flex flex-wrap gap-4 mt-8"
            aria-label="Navigation des résultats"
          >
            <UiButton bg="white" text="raspberry">
              <a
                href="/"
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded px-2 py-1"
              >
                ← Retour à l'accueil
              </a>
            </UiButton>
            <UiButton
              bg="raspberry"
              text="white"
              onClick={handlePDFExport}
              aria-label="Exporter les résultats en PDF"
            >
              ↓ Export en PDF
            </UiButton>
          </nav>

        </div>
      </div>
      <Footer />
    </div>
  );
}