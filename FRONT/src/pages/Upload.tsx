import { useRef, useState } from "react";
import { X, UploadCloud, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Card from "../components/Card";
import UiButton from "../components/UiButton";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import type { AnalysisApiResult } from "../types";

export default function Upload() {
  const navigate  = useNavigate();
  const inputRef  = useRef<HTMLInputElement>(null);
  const [file,    setFile]    = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  useScrollAnimations();

  const API_URL = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL ?? "http://localhost:3001";

  const handleClick = (): void => { inputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const removeFile = (): void => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  const sendPdf = async (): Promise<void> => {
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch(`${API_URL}/analyse`, { method: "POST", body: formData });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Erreur serveur");
      }

      const data = await res.json() as AnalysisApiResult;
      localStorage.setItem("analysisResult", JSON.stringify(data));
      navigate("/results");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Upload error:", msg);
      alert("Erreur pendant l'analyse: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main id="main-content" role="main" aria-labelledby="page-title" className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-[560px] w-full flex flex-col gap-6">

          <div data-animate data-animate-variant="fade-up" className="flex items-center justify-between">
            <h1 id="page-title" className="text-base font-semibold text-gray-900">
              Téléversez votre rapport de laboratoire
            </h1>
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Fermer la page de téléversement"
              className="p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400"
            >
              <X className="text-gray-600" aria-hidden="true" />
            </button>
          </div>

          <div data-animate data-animate-variant="zoom" data-animate-delay="0.1">
            <Card
              onClick={!file ? handleClick : undefined}
              ariaLabel={file ? "Fichier chargé" : "Téléverser un fichier de rapport de laboratoire"}
              className="w-full h-[248px]"
              icon={
                file
                  ? <CheckCircle size={48} className="text-green-600" aria-hidden="true" />
                  : <UploadCloud size={48} className="text-raspberry-600" aria-hidden="true" />
              }
              title={file ? "Fichier téléchargé avec succès" : "Téléversez votre fichier"}
              description={
                file
                  ? file.name
                  : "Appuyez sur Entrée ou Espace pour parcourir les fichiers. Formats acceptés : PDF, CSV, TXT, PNG, JPG"
              }
            />
          </div>

          <input
            ref={inputRef}
            id="file-upload"
            type="file"
            accept=".pdf,.csv,.txt,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Sélectionner un fichier de rapport de laboratoire"
            aria-describedby="file-upload-hint"
          />
          <p id="file-upload-hint" className="sr-only">Formats acceptés : PDF, CSV, TXT, PNG, JPG.</p>
          <div aria-live="polite" className="sr-only">{file ? `Fichier ${file.name} sélectionné` : ""}</div>

          {file && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={removeFile}
                aria-label="Supprimer le fichier sélectionné"
                className="text-sm text-raspberry-600 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400"
              >
                Supprimer le fichier
              </button>
            </div>
          )}

          {file && (
            <UiButton
              bg="raspberry" text="white"
              aria-label="Analyser le rapport sélectionné"
              onClick={() => { void sendPdf(); }}
              disabled={loading}
              className={`w-full py-3 text-base ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? "Analyse en cours..." : "Analyser ce rapport"}
            </UiButton>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
