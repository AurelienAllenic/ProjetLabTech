import { useNavigate } from "react-router-dom";
import { UploadCloud, Edit3 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Card from "../components/Card";

export default function Analysis() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <Header />

      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center pt-28"
        role="main"
        aria-labelledby="page-title"
      >
        <h1 id="page-title" className="text-4xl font-bold text-gray-900">
          Comment souhaitez-vous commencer votre analyse&nbsp;?
        </h1>
        <p id="page-description" className="text-base font-normal text-gray-500 max-w-xl">
          Vous pouvez soit téléverser un rapport de laboratoire, soit saisir vos résultats manuellement.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 mt-6" role="group" aria-label="Choix du mode de démarrage de l'analyse">
          <Card
            icon={<UploadCloud aria-hidden="true" size={48} />}
            title="Téléverser un rapport de laboratoire"
            description="Formats acceptés : PDF, CSV, TXT ou image. Les données seront extraites automatiquement."
            ariaLabel="Téléverser un rapport de laboratoire pour analyse automatique"
            onClick={() => navigate("/upload")}
          />
          <Card
            icon={<Edit3 aria-hidden="true" size={48} />}
            title="Saisir les résultats manuellement"
            description="Créer une liste de tests et entrer vos valeurs vous-même."
            ariaLabel="Saisir manuellement les résultats d'analyse"
            onClick={() => navigate("/manual")}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
