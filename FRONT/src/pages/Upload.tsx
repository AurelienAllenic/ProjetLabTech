import { useRef, useState, useEffect } from "react";
import { X, UploadCloud, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Card from "../components/Card";
import UiButton from "../components/UiButton";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import type { AnalysisApiResult } from "../types";
import { UPLOAD_FILE_ACCEPT, UPLOAD_FILE_FORMATS_LABEL } from "../constants/uploadFormats";

const UPLOAD_ZONE_BUTTON_ID = "upload-file-zone";

function shouldIgnoreGlobalUploadHotkey(uploadZoneButtonId: string): boolean {
  const ae = document.activeElement;
  if (!(ae instanceof HTMLElement)) return false;

  if (ae.closest("footer")) return true;

  if (
    ae instanceof HTMLInputElement ||
    ae instanceof HTMLTextAreaElement ||
    ae instanceof HTMLSelectElement
  ) {
    return true;
  }
  if (ae.isContentEditable) return true;
  if (ae instanceof HTMLAnchorElement && ae.hasAttribute("href")) return true;
  if (ae instanceof HTMLButtonElement && ae.id !== uploadZoneButtonId) return true;

  return false;
}

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  useScrollAnimations();

  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

  /** Après sélection d’un fichier : premier contrôle pertinent = « Supprimer » (annuler avant analyse). */
  useEffect(() => {
    if (!file) return;
    const handle = window.requestAnimationFrame(() => {
      document.getElementById("upload-remove-file")?.focus();
    });
    return () => window.cancelAnimationFrame(handle);
  }, [file]);

  /**
   * Entrée ou Espace ouvrent le sélecteur sans être obligé de focaliser la carte
   * (écoute en capture pour bloquer le défilement au clavier avec la barre d’espace).
   */
  useEffect(() => {
    if (file !== null || loading) return;

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.defaultPrevented) return;
      const isActivate = e.key === "Enter" || e.key === " " || e.code === "Space";
      if (!isActivate) return;
      if (e.repeat) return;
      if (shouldIgnoreGlobalUploadHotkey(UPLOAD_ZONE_BUTTON_ID)) return;

      e.preventDefault();
      inputRef.current?.click();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [file, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const removeFile = (): void => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    window.queueMicrotask(() => {
      document.getElementById(UPLOAD_ZONE_BUTTON_ID)?.focus();
    });
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

      <main
        id="main-content"
        role="main"
        aria-labelledby="page-title"
        tabIndex={-1}
        className="relative min-h-screen flex items-center justify-center px-4 py-24 scroll-mt-28 outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-50 rounded-sm"
      >
        <section
          aria-labelledby="page-title"
          aria-busy={loading}
          className="max-w-[560px] w-full flex flex-col gap-6"
        >
          <div data-animate data-animate-variant="fade-up">
            <h1 id="page-title" className="text-base font-semibold text-gray-900">
              Téléversez votre rapport de laboratoire
            </h1>
          </div>

          <div data-animate data-animate-variant="zoom" data-animate-delay="0.1">
            <Card
              onOpenFilePicker={file ? undefined : () => inputRef.current?.click()}
              uploadZoneButtonId={file ? undefined : UPLOAD_ZONE_BUTTON_ID}
              ariaLabel={
                file ? "Fichier chargé" : "Téléverser un fichier de rapport de laboratoire"
              }
              className="w-full h-[248px]"
              icon={
                file ? (
                  <CheckCircle size={48} className="text-green-600" aria-hidden="true" />
                ) : (
                  <UploadCloud size={48} className="text-raspberry-600" aria-hidden="true" />
                )
              }
              title={
                file ? "Fichier téléchargé avec succès" : "Téléversez votre fichier"
              }
              description={
                file
                  ? file.name
                  : "Appuyez sur Entrée ou Espace pour parcourir les fichiers. Formats acceptés : PDF, PNG, JPG"
              }
            />
          </div>

          <input
            ref={inputRef}
            id="file-upload"
            type="file"
            tabIndex={-1}
            accept={UPLOAD_FILE_ACCEPT}
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Sélectionner un fichier de rapport de laboratoire"
            aria-describedby="file-upload-hint"
          />
          <p id="file-upload-hint" className="sr-only">
            {`Sur cette page, Entrée ou Espace ouvre le sélecteur. Formats acceptés : ${UPLOAD_FILE_FORMATS_LABEL}.`}
          </p>
          <div aria-live="polite" className="sr-only">
            {file ? `Fichier ${file.name} sélectionné` : ""}
          </div>

          {file ? (
            <div className="flex justify-center">
              <button
                id="upload-remove-file"
                type="button"
                onClick={removeFile}
                aria-label="Supprimer le fichier sélectionné"
                className="text-sm text-raspberry-600 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded px-1"
              >
                Supprimer le fichier
              </button>
            </div>
          ) : null}

          {file ? (
            <UiButton
              id="upload-submit-analysis"
              bg="raspberry"
              text="white"
              type="button"
              disabled={loading}
              aria-busy={loading}
              onClick={() => {
                void sendPdf();
              }}
              className={`w-full py-3 text-base ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? "Analyse en cours..." : "Analyser ce rapport"}
            </UiButton>
          ) : null}
        </section>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute top-24 right-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded z-10"
        >
          <X size={18} aria-hidden="true" /> Fermer
        </button>
      </main>
      <Footer />
    </div>
  );
}
