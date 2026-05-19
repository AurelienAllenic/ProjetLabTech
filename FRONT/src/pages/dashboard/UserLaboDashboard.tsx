import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, PenLine, LogOut } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import UiButton from "../../components/UiButton";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useScrollAnimations } from "../../hooks/useScrollAnimations";

export default function UserLaboDashboard(): ReactElement | null {
  const { user, logout } = useAuth();
  useScrollAnimations();
  usePageTitle("Mon espace laboratoire");

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main id="main-content" role="main" className="flex-1 px-4 pt-28 pb-16 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-raspberry-600 mb-1">
              Utilisateur laboratoire
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour, {user.displayName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          </div>
          <UiButton
            type="button"
            bg="white"
            text="raspberry"
            onClick={logout}
            className="flex items-center gap-2 shrink-0"
          >
            <LogOut size={18} aria-hidden="true" /> Déconnexion
          </UiButton>
        </div>

        <p className="text-sm text-gray-600 mb-6 max-w-2xl">
          Depuis cet espace vous pouvez téléverser un rapport au format PDF pour analyse automatique,
          ou saisir les valeurs manuellement.
        </p>

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

        <p className="mt-8 text-xs text-gray-400">
          Les analyses utilisent les parcours existants du site ; aucune donnée réelle n&apos;est envoyée vers un backend dans cette démo.
        </p>
      </main>

      <Footer />
    </div>
  );
}
