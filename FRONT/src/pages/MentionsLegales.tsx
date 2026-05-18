import type { ReactNode } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useScrollAnimations } from "../hooks/useScrollAnimations";

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

export default function MentionsLegales() {
  useScrollAnimations();
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <main id="main-content" role="main" className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div data-animate data-animate-variant="fade-up" className="mb-10">
          <Link to="/" className="text-xs text-raspberry-600 hover:underline">← Retour à l'accueil</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Conditions d'utilisation</h1>
          <p className="text-xs text-gray-400">Dernière mise à jour : 1er janvier 2025</p>
        </div>

        <Section title="1. Présentation du service">
          <p>
            Lab'IA est un service en ligne gratuit édité par Lab'IA SAS (ci-après « la Société »), dont le siège social est situé à Paris, France. Le service propose une aide à la compréhension de résultats médicaux de laboratoire grâce à l'intelligence artificielle.
          </p>
          <p>
            Lab'IA n'est en aucun cas un dispositif médical, un logiciel médical certifié, ni un service de télémédecine. Le service est destiné à des fins éducatives et informatives uniquement.
          </p>
        </Section>

        <Section title="2. Acceptation des conditions">
          <p>
            L'utilisation du service Lab'IA implique l'acceptation pleine et entière des présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service.
          </p>
          <p>
            La Société se réserve le droit de modifier les présentes conditions à tout moment. Les modifications entrent en vigueur dès leur publication sur le site.
          </p>
        </Section>

        <Section title="3. Utilisation du service">
          <p>Vous vous engagez à utiliser Lab'IA uniquement pour des usages licites et conformes aux présentes conditions. Il est notamment interdit de :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Utiliser le service à des fins commerciales sans autorisation préalable</li>
            <li>Tenter de contourner les mesures de sécurité du service</li>
            <li>Transmettre des données erronées dans le but de tromper l'analyse</li>
            <li>Reproduire ou distribuer les résultats générés à des fins médicales professionnelles</li>
          </ul>
        </Section>

        <Section title="4. Avertissement médical">
          <p className="font-semibold text-gray-800">
            Les résultats fournis par Lab'IA sont à titre indicatif et ne constituent pas un avis médical professionnel.
          </p>
          <p>
            Lab'IA ne remplace en aucun cas une consultation médicale, un diagnostic ou une prescription établis par un professionnel de santé qualifié.
          </p>
          <p>
            La Société décline toute responsabilité en cas de préjudice résultant d'une interprétation incorrecte des informations fournies par le service.
          </p>
        </Section>

        <Section title="5. Propriété intellectuelle">
          <p>
            L'ensemble des éléments constituant le service Lab'IA est protégé par le droit de la propriété intellectuelle et appartient à la Société ou à ses partenaires.
          </p>
          <p>
            Toute reproduction, représentation ou exploitation non autorisée est strictement interdite.
          </p>
        </Section>

        <Section title="6. Limitation de responsabilité">
          <p>
            Le service est fourni « en l'état », sans garantie d'exactitude ou d'adéquation à un usage particulier. La Société ne pourra être tenue responsable de dommages directs ou indirects découlant de l'utilisation du service.
          </p>
        </Section>

        <Section title="7. Droit applicable">
          <p>
            Les présentes conditions sont régies par le droit français. En cas de litige, les tribunaux compétents de Paris seront seuls compétents.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            Pour toute question relative aux présentes conditions : <a href="mailto:legal@labia.com" className="text-raspberry-600 hover:underline">legal@labia.com</a>
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
