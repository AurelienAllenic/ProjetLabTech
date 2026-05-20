import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, PenLine, Download } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import UiButton from "../../components/UiButton";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useScrollAnimations } from "../../hooks/useScrollAnimations";
import { apiGet } from "../../lib/api";

interface MyAssignmentApi {
  id: string;
  document_id: string;
  document_title: string;
  storage_path: string | null;
  assigned_at: string;
}

export default function UserLaboDashboard(): ReactElement | null {
  const { user } = useAuth();
  useScrollAnimations();
  usePageTitle("Mon espace laboratoire");

  const [assignedDocs, setAssignedDocs] = useState<MyAssignmentApi[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ assignments: MyAssignmentApi[] }>("/assignments/mine")
      .then(({ assignments }) => {
        if (!cancelled) setAssignedDocs(assignments ?? []);
      })
      .catch(() => {
        if (!cancelled) setAssignedDocs([]);
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownloadAssigned = async (assignmentId: string): Promise<void> => {
    setDownloadingId(assignmentId);
    try {
      const { signedUrl } = await apiGet<{ signedUrl: string }>(
        `/assignments/mine/${assignmentId}/signed-url`,
      );
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Impossible de télécharger le fichier.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main id="main-content" role="main" className="flex-1 px-4 pt-28 pb-16 max-w-5xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-raspberry-600 mb-1">
            Utilisateur laboratoire
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user.displayName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
        </div>

        <p className="text-sm text-gray-600 mb-6 max-w-2xl">
          Depuis cet espace vous pouvez téléverser un rapport au format PDF pour analyse automatique,
          ou saisir les valeurs manuellement. Les documents PDF que votre laboratoire vous attribue
          apparaissent ci-dessous lorsqu&apos;un fichier a été téléversé pour vous.
        </p>

        <section aria-labelledby="assigned-docs-title" className="mb-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 id="assigned-docs-title" className="text-lg font-semibold text-gray-900 mb-3">
            Documents attribués par le laboratoire
          </h2>
          {docsLoading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : assignedDocs.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucune attribution enregistrée pour votre compte. Lorsque le laboratoire vous attribue un PDF qu&apos;il a téléversé,
              il apparaîtra ici avec un lien de téléchargement sécurisé.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {assignedDocs.map((row) => (
                <li key={row.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 first:pt-0">
                  <div>
                    <p className="font-medium text-gray-900">{row.document_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Attribué le {new Date(row.assigned_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {row.storage_path ? (
                    <UiButton
                      type="button"
                      bg="white"
                      text="raspberry"
                      className="flex items-center gap-2 shrink-0 border border-gray-200"
                      disabled={downloadingId === row.id}
                      onClick={() => { void handleDownloadAssigned(row.id); }}
                    >
                      <Download size={18} aria-hidden="true" />
                      {downloadingId === row.id ? "Ouverture…" : "Télécharger le PDF"}
                    </UiButton>
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">
                      Référence sans fichier — utilisez Analyse avec votre PDF.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid sm:grid-cols-2 gap-5">
          <Link
            to="/upload"
            className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-raspberry-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-raspberry-100 text-raspberry-600 group-hover:bg-raspberry-200 transition">
              <UploadCloud size={24} aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold text-gray-900">Téléverser un fichier</span>
            <span className="text-sm text-gray-500">
              Envoyez un PDF de résultats pour extraction et analyse par l&apos;IA.
            </span>
          </Link>

          <Link
            to="/manual"
            className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-raspberry-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-raspberry-700 group-hover:bg-blue-200 transition">
              <PenLine size={24} aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold text-gray-900">Analyser (saisie manuelle)</span>
            <span className="text-sm text-gray-500">
              Saisissez les noms de tests et les valeurs sans fichier PDF.
            </span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
