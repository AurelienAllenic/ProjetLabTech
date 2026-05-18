import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useScrollAnimations } from "../hooks/useScrollAnimations";

const Section = ({ title, children }) => (
  <section data-animate data-animate-variant="fade-up" className="mb-10">
    <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const CookieRow = ({ name, type, purpose, duration }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 pr-4 font-mono text-xs text-gray-700">{name}</td>
    <td className="py-3 pr-4 text-xs">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        type === "Nécessaire" ? "bg-green-100 text-green-700" :
        type === "Analytique" ? "bg-blue-100 text-blue-700" :
        "bg-gray-100 text-gray-600"
      }`}>{type}</span>
    </td>
    <td className="py-3 pr-4 text-xs text-gray-600">{purpose}</td>
    <td className="py-3 text-xs text-gray-500">{duration}</td>
  </tr>
);

export default function Cookies() {
  useScrollAnimations();
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <main id="main-content" role="main" className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div data-animate data-animate-variant="fade-up" className="mb-10">
          <Link to="/" className="text-xs text-raspberry-600 hover:underline">← Retour à l'accueil</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Politique des cookies</h1>
          <p className="text-xs text-gray-400">Dernière mise à jour : 1er janvier 2025</p>
        </div>

        <Section title="1. Qu'est-ce qu'un cookie ?">
          <p>
            Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de votre visite sur un site internet. Il permet au site de mémoriser des informations sur votre visite afin d'améliorer votre expérience.
          </p>
          <p>
            Les cookies ne contiennent pas de données personnelles identifiables et ne peuvent pas exécuter de programmes ni infecter votre terminal.
          </p>
        </Section>

        <Section title="2. Les cookies utilisés par Lab'IA">
          <p>Lab'IA utilise un nombre limité de cookies, tous décrits ci-dessous :</p>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="pb-3 text-xs font-semibold text-gray-700 pr-4">Nom</th>
                  <th className="pb-3 text-xs font-semibold text-gray-700 pr-4">Type</th>
                  <th className="pb-3 text-xs font-semibold text-gray-700 pr-4">Finalité</th>
                  <th className="pb-3 text-xs font-semibold text-gray-700">Durée</th>
                </tr>
              </thead>
              <tbody>
                <CookieRow
                  name="labia_session"
                  type="Nécessaire"
                  purpose="Maintien de la session utilisateur (stockage temporaire des résultats)"
                  duration="Session"
                />
                <CookieRow
                  name="labia_consent"
                  type="Nécessaire"
                  purpose="Mémorisation de vos préférences de consentement aux cookies"
                  duration="12 mois"
                />
                <CookieRow
                  name="_ga"
                  type="Analytique"
                  purpose="Mesure d'audience anonymisée (Google Analytics)"
                  duration="13 mois"
                />
                <CookieRow
                  name="_ga_*"
                  type="Analytique"
                  purpose="Identifiant de session Google Analytics"
                  duration="13 mois"
                />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. Cookies nécessaires">
          <p>
            Les cookies nécessaires au fonctionnement du service sont déposés sans nécessiter votre consentement préalable, conformément à l'article 82 de la loi Informatique et Libertés et aux recommandations de la CNIL.
          </p>
          <p>
            Ils incluent notamment les cookies permettant de maintenir votre session active le temps de l'analyse.
          </p>
        </Section>

        <Section title="4. Cookies analytiques">
          <p>
            Les cookies analytiques nous permettent de mesurer l'audience du service de façon anonymisée. Les données collectées sont agrégées et ne permettent pas d'identifier un utilisateur spécifiquement.
          </p>
          <p>
            Ces cookies sont déposés uniquement avec votre consentement, recueilli lors de votre première visite.
          </p>
        </Section>

        <Section title="5. Cookies tiers">
          <p>
            Lab'IA n'intègre aucun cookie de réseaux sociaux ni de régies publicitaires tierces. Aucune donnée n'est partagée à des fins publicitaires.
          </p>
        </Section>

        <Section title="6. Gestion de vos préférences">
          <p>Vous pouvez à tout moment gérer vos préférences de cookies :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Via votre navigateur</strong> : la plupart des navigateurs vous permettent de désactiver ou supprimer les cookies dans leurs paramètres</li>
            <li><strong>Via notre bandeau de consentement</strong> : accessible à tout moment depuis le lien en bas de page</li>
            <li><strong>Via Google Analytics</strong> : en installant le module complémentaire de désactivation disponible sur <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-raspberry-600 hover:underline">tools.google.com</a></li>
          </ul>
          <p className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800">
            ⚠️ La désactivation des cookies nécessaires peut empêcher le bon fonctionnement du service.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            Pour toute question relative à notre utilisation des cookies, contactez-nous à : <a href="mailto:dpo@labia.com" className="text-raspberry-600 hover:underline">dpo@labia.com</a>
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
