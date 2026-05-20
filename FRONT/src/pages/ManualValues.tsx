import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UiButton from "../components/UiButton";
import TestValueCard from "../components/TestValueCard";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import { usePageTitle } from "../hooks/usePageTitle";
import type { TestValueData, ManualNavigationState, AnalysisApiResult } from "../types";
import { buildManualConclusion } from "../lib/manualConclusion";

export default function ManualValues() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: ManualNavigationState | null };
  const tests = state?.tests ?? [];
  useScrollAnimations();
  usePageTitle("Saisir les valeurs");

  const [values,  setValues]  = useState<Record<string, TestValueData>>({});
  const [loading, setLoading] = useState(false);

  const handleValueChange = (testName: string, value: TestValueData): void => {
    setValues((prev) => ({ ...prev, [testName]: value }));
  };

  const handleManualAnalysis = (): void => {
    setLoading(true);
    try {
      const elements = Object.entries(values).map(([name, data]) => {
        const numericValue = parseFloat(data.value);
        const hasReference =
          data.min !== "" && data.max !== "" &&
          !isNaN(parseFloat(data.min)) && !isNaN(parseFloat(data.max));

        let categorie   = "abnormal";
        let explication = "Cette valeur mérite une attention particulière.";

        if (!isNaN(numericValue) && hasReference &&
            numericValue >= parseFloat(data.min) && numericValue <= parseFloat(data.max)) {
          categorie   = "normal";
          explication = "La valeur se situe dans la plage de référence indiquée.";
        } else if (!hasReference && !isNaN(numericValue)) {
          categorie   = "normal";
          explication = "Aucune plage de référence fournie, la valeur semble cohérente.";
        }

        return {
          nom:        name,
          taux:       data.value ? `${data.value} ${data.unit}`.trim() : "-",
          categorie,
          intervalle: hasReference ? `${data.min} – ${data.max} ${data.unit}`.trim() : "Non renseignée",
          explication,
        };
      });

      const analysisResult: AnalysisApiResult = {
        success: true,
        result: {
          elements,
          warning: "Analyse manuelle : interprétation simplifiée basée sur les valeurs renseignées.",
          conclusion: buildManualConclusion(elements),
        },
      };

      localStorage.setItem("analysisResult", JSON.stringify(analysisResult));
      navigate("/results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main id="main-content" role="main" aria-labelledby="page-title" tabIndex={-1}
        className="relative min-h-screen flex justify-center px-4 pt-28 pb-16 scroll-mt-28"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour à l'étape précédente"
          className="absolute top-24 right-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded"
        >
          <ArrowLeft size={18} aria-hidden="true" /> Retour
        </button>

        <div className="max-w-180 w-full flex flex-col gap-6">

          <header data-animate data-animate-variant="fade-up">
            <h1 id="page-title" className="text-base font-semibold text-gray-900">
              Entrez vos valeurs de test
            </h1>
            <p className="text-base font-normal text-gray-500">
              Renseignez manuellement les valeurs de votre rapport de laboratoire.
            </p>
          </header>

          <section aria-labelledby="test-values-title" className="flex flex-col gap-4">
            <h2 id="test-values-title" className="sr-only">Formulaire de saisie des valeurs de test</h2>
            <ul className="flex flex-col gap-4" aria-live="polite" aria-label="Liste des tests à renseigner" data-animate-group>
              {tests.map((test) => (
                <li key={test} data-animate-child>
                  <TestValueCard name={test} onChange={handleValueChange} />
                </li>
              ))}
            </ul>
          </section>

          <UiButton
            bg="raspberry" text="white"
            onClick={handleManualAnalysis}
            disabled={loading}
            className={`w-full py-3 text-base ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? "Analyse en cours..." : "Analyser les résultats"}
          </UiButton>
        </div>
      </main>
      <Footer />
    </div>
  );
}
