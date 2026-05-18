import { useNavigate, useLocation } from "react-router-dom";
import UiButton from "./UiButton";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isResultsPage = location.pathname === "/results";

  return (
    <>
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-[100] -translate-y-full focus:translate-y-0 transition-transform bg-white text-raspberry-900 px-4 py-2 rounded-br-md shadow-lg focus:outline-none focus:ring-2 focus:ring-raspberry-500"
      >
        Aller au contenu principal
      </a>

      <header
        role="banner"
        className="fixed top-0 left-0 right-0 w-full flex items-center justify-between px-8 py-3 bg-white shadow-sm border-b border-gray-100 z-50"
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded-xl p-1"
          aria-label="Retour à l'accueil – Lab'IA"
        >
          <img
            src="/logo.png"
            alt="Logo Lab'IA"
            className="h-10 w-auto"
          />
          <div
            className="flex flex-col text-left"
            aria-labelledby="site-title site-description"
          >
            <span
              id="site-title"
              className="text-base font-bold text-raspberry-900 leading-tight"
            >
              Lab'IA
            </span>
            <span
              id="site-description"
              className="text-xs text-gray-400 font-normal"
            >
              Analyse de résultats médicaux
            </span>
          </div>
        </button>

        <nav
          className="flex items-center gap-3"
          aria-label="Actions principales de l'en-tête"
        >
          {isResultsPage && (
            <UiButton
              bg="raspberry"
              text="white"
              aria-label="Lancer une nouvelle analyse médicale"
              onClick={() => navigate("/")}
            >
              Nouvelle analyse
            </UiButton>
          )}
        </nav>
      </header>
    </>
  );
}
