import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import UiButton from "../components/UiButton";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import { usePageTitle } from "../hooks/usePageTitle";

const COMMON_TESTS: string[] = [
  "Hémoglobine", "Glucose", "Plaquettes", "Créatinine", "CRP",
  "Calcium", "Numération des globules rouges (GR)",
  "Numération des globules blancs", "Cholestérol total",
  "Triglycérides", "Fer sérique",
];

export default function Manual() {
  const navigate = useNavigate();
  useScrollAnimations();
  usePageTitle("Saisie manuelle");

  const [testName, setTestName] = useState("");
  const [tests,    setTests]    = useState<string[]>([]);
  const [sex,      setSex]      = useState("");
  const [age,      setAge]      = useState("");

  const addTest = (name: string): void => {
    if (!name.trim()) return;
    setTests((prev) => [...prev, name.trim()]);
    setTestName("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    addTest(testName);
  };

  const removeTest = (index: number): void => {
    setTests((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main id="main-content" role="main" aria-labelledby="page-title" className="relative min-h-screen flex items-center justify-center px-4 py-24">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute top-24 right-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded"
        >
          <X size={18} aria-hidden="true" /> Fermer
        </button>

        <div className="max-w-160 w-full flex flex-col gap-6">

          <div data-animate data-animate-variant="fade-up">
            <h1 id="page-title" className="text-base font-semibold text-gray-900">
              Construisez votre liste de tests
            </h1>
            <p className="text-base font-normal text-gray-500">
              Ajoutez les tests que vous souhaitez analyser
            </p>
          </div>

          <section data-animate data-animate-variant="fade-up" data-animate-delay="0.1"
            className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 shadow-sm"
            aria-labelledby="patient-info-title"
          >
            <h2 id="patient-info-title" className="text-sm font-semibold text-gray-900">
              Informations du patient
            </h2>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm text-gray-700">Sexe</legend>
              <div className="flex gap-3">
                {(["homme", "femme"] as const).map((value) => (
                  <label
                    key={value}
                    htmlFor={`sex-${value}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm cursor-pointer transition select-none
                      ${sex === value
                        ? "bg-raspberry-600 text-white border-raspberry-600"
                        : "border-gray-200 text-gray-600 hover:border-raspberry-300"
                      }`}
                  >
                    <input
                      id={`sex-${value}`}
                      type="radio"
                      name="sex"
                      value={value}
                      checked={sex === value}
                      onChange={() => setSex(value)}
                      className="sr-only"
                    />
                    {value === "homme" ? "Homme" : "Femme"}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor="age" className="text-sm text-gray-700">Âge</label>
              <input
                id="age"
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-label="Âge du patient"
                aria-describedby="age-help"
                placeholder="ex : 28"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
              />
              <span id="age-help" className="sr-only">Entrez l'âge du patient en années</span>
            </div>
          </section>

          <section data-animate data-animate-variant="fade-up" data-animate-delay="0.2"
            className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 shadow-sm"
            aria-labelledby="add-test-title"
          >
            <h2 id="add-test-title" className="text-sm font-semibold text-gray-900">Nom du test</h2>
            <span id="add-test-label" className="text-sm text-gray-500">
              Taper entrée libre pour ajouter ou choisir parmi les tests courants :
            </span>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <label htmlFor="test-name" className="sr-only">Nom du test à ajouter</label>
                <input
                  id="test-name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  aria-label="Nom du test à ajouter"
                  placeholder="ex : Hémoglobine, Glucose"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                />
              </div>
              <a
                href="#section-suivante"
                className="text-sm text-raspberry-600 underline focus:outline-none focus:ring-2 focus:ring-raspberry-400 rounded w-fit"
              >
                Passer à la section suivante
              </a>
              <div className="flex flex-wrap gap-2">
                {COMMON_TESTS.map((test) => (
                  <button
                    key={test}
                    type="button"
                    onClick={() => addTest(test)}
                    aria-label={`Ajouter le test ${test}`}
                    className="px-3 py-1 rounded-full bg-raspberry-50 border border-raspberry-200 text-raspberry-700 text-sm hover:bg-raspberry-100 focus:outline-none focus:ring-2 focus:ring-raspberry-400"
                  >
                    {test}
                  </button>
                ))}
              </div>
            </form>
          </section>

          <section id="section-suivante" data-animate data-animate-variant="fade-up" data-animate-delay="0.3"
            className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 shadow-sm"
            aria-labelledby="your-tests-title"
          >
            <h2 id="your-tests-title" className="text-sm font-semibold text-gray-900">
              Vos tests ({tests.length})
            </h2>
            <ul aria-live="polite" aria-label="Liste des tests sélectionnés" className="flex flex-col gap-2">
              {tests.map((test, index) => (
                <li key={`${test}-${index}`} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                  <span className="text-sm">{test}</span>
                  <button
                    type="button"
                    onClick={() => removeTest(index)}
                    aria-label={`Supprimer le test ${test}`}
                    className="focus:outline-none focus:ring-2 focus:ring-raspberry-400 rounded"
                  >
                    <Trash2 className="text-gray-400 hover:text-red-500" size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {tests.length > 0 && sex && age && (
            <UiButton
              bg="raspberry" text="white"
              onClick={() => navigate("/manual/values", { state: { tests, sex, age: Number(age) } })}
              className="w-full py-3 text-base"
            >
              Suivant : Entrez les valeurs
            </UiButton>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
