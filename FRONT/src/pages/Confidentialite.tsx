import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import { usePageTitle } from "../hooks/usePageTitle";

interface SectionProps {
  title: string;
  children: ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <section data-animate data-animate-variant="fade-up" className="mb-10">
    <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function Confidentialite() {
  useScrollAnimations();
  usePageTitle("Politique de confidentialite");
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <main id="main-content" role="main" className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div data-animate data-animate-variant="fade-up" className="mb-10">
          <Link to="/" className="text-xs text-raspberry-600 hover:underline">← Retour à l'accueil</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Politique de confidentialité</h1>
          <p className="text-xs text-gray-400">Dernière mise à jour : 1er janvier 2025</p>
        </div>

        <div data-animate data-animate-variant="zoom" data-animate-delay="0.1"
          className="bg-blue-50 border border-raspberry-200 rounded-2xl p-5 mb-10 text-sm text-raspberry-800"
        >
          <p className="font-semibold mb-1">Notre engagement</p>
          <p>Lab'IA est conçu avec la confidentialité au cœur de son fonctionnement. Vos données médicales ne sont jamais revendues ni partagées avec des tiers à des fins commerciales.</p>
        </div>

        <Section title="1. Responsable du traitement">
          <p>Le responsable du traitement des données personnelles collectées via Lab'IA est la société Lab'IA SAS, dont le siège social est situé à Paris, France.</p>
          <p>Contact DPO : <a href="mailto:dpo@labia.com" className="text-raspberry-600 hover:underline">dpo@labia.com</a></p>
        </Section>

        <Section title="2. Données collectées">
          <p>Dans le cadre de l'utilisation du service, Lab'IA peut traiter les données suivantes :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Données de santé</strong> : résultats de laboratoire transmis par l'utilisateur (PDF ou saisie manuelle)</li>
            <li><strong>Données de navigation</strong> : adresse IP, type de navigateur, pages visitées (via cookies techniques)</li>
            <li><strong>Données de contact</strong> : adresse e-mail en cas de contact avec le support</li>
          </ul>
          <p>Les données de santé saisies ne sont pas associées à une identité. Elles sont traitées de manière anonyme et temporaire.</p>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fournir le service d'analyse des résultats médicaux</li>
            <li>Améliorer la qualité et la précision du service</li>
            <li>Assurer la sécurité et le bon fonctionnement technique</li>
            <li>Répondre à vos demandes de support</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>Le traitement de vos données repose sur :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Votre consentement explicite</strong> pour les données de santé (article 9 RGPD)</li>
            <li><strong>L'exécution du service</strong> pour les données techniques nécessaires au fonctionnement</li>
            <li><strong>Notre intérêt légitime</strong> pour la sécurité et l'amélioration du service</li>
          </ul>
        </Section>

        <Section title="5. Durée de conservation">
          <p>
            Les données de santé sont traitées en mémoire pendant la session et <strong>ne sont pas conservées</strong> sur nos serveurs au-delà de la session active.
          </p>
          <p>
            Les données de navigation sont conservées pendant <strong>13 mois maximum</strong>, conformément aux recommandations de la CNIL.
          </p>
        </Section>

        <Section title="6. Sécurité des données">
          <p>Lab'IA met en œuvre les mesures techniques suivantes pour protéger vos données :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chiffrement des transmissions (TLS 1.3)</li>
            <li>Hébergement des données en France (HDS agréé)</li>
            <li>Accès restreint aux données par le personnel habilité</li>
            <li>Journalisation des accès et audits de sécurité réguliers</li>
          </ul>
        </Section>

        <Section title="7. Partage des données">
          <p>Lab'IA ne vend, ne loue et ne cède jamais vos données à des tiers à des fins commerciales.</p>
          <p>Les données peuvent être partagées avec :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nos sous-traitants techniques liés par contrat de confidentialité</li>
            <li>Les autorités compétentes, uniquement sur demande légale</li>
          </ul>
        </Section>

        <Section title="8. Vos droits">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Droit d'accès</strong> à vos données personnelles</li>
            <li><strong>Droit de rectification</strong> des données inexactes</li>
            <li><strong>Droit à l'effacement</strong> (« droit à l'oubli »)</li>
            <li><strong>Droit à la portabilité</strong> de vos données</li>
            <li><strong>Droit d'opposition</strong> au traitement</li>
            <li><strong>Droit à la limitation</strong> du traitement</li>
          </ul>
          <p>
            Pour exercer ces droits : <a href="mailto:dpo@labia.com" className="text-raspberry-600 hover:underline">dpo@labia.com</a>. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-raspberry-600 hover:underline">CNIL</a>.
          </p>
        </Section>

        <Section title="9. Transferts hors UE">
          <p>Vos données sont hébergées et traitées exclusivement au sein de l'Union Européenne. Aucun transfert vers des pays tiers n'est effectué.</p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
