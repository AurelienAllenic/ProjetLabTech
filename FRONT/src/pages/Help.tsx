import { useState } from "react";
import type { ElementType } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useScrollAnimations } from "../hooks/useScrollAnimations";
import { ChevronDown, Upload, FileText, Headphones, Settings as _Settings, Shield, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface GuideItem {
  icon: ElementType;
  title: string;
  description: string;
  color: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Comment télécharger mes résultats médicaux ?",
    answer: "Allez à la section 'Analyser' et cliquez sur 'Télécharger un fichier'. Sélectionnez votre PDF de résultats. Lab'IA accepte les fichiers PDF jusqu'à 10 MB. Vos données sont chiffrées et sécurisées.",
  },
  {
    question: "Puis-je saisir manuellement mes valeurs ?",
    answer: "Oui ! Si vous n'avez pas de PDF, vous pouvez entrer les valeurs manuellement. Cliquez sur 'Saisir les valeurs' et remplissez les champs avec vos résultats de laboratoire.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer: "Absolument. Lab'IA utilise le chiffrement de bout en bout (E2E) et respecte les normes GDPR. Vos données médicales ne sont jamais partagées ou stockées sur nos serveurs.",
  },
  {
    question: "Lab'IA peut-il remplacer une consultation médicale ?",
    answer: "Non. Lab'IA est un outil éducatif pour comprendre vos résultats. Consultez toujours votre médecin pour des conseils médicaux professionnels.",
  },
  {
    question: "Quels formats de fichiers sont acceptés ?",
    answer: "Nous acceptons les fichiers PDF. Si votre rapport est en format image (JPG, PNG), convertissez-le d'abord en PDF.",
  },
  {
    question: "Comment utiliser le lecteur audio ?",
    answer: "Après avoir téléchargé vos résultats, cliquez sur l'icône 'son' pour écouter l'explication audio. Vous pouvez ajuster la vitesse de lecture.",
  },
];

const GUIDES: GuideItem[] = [
  {
    icon: Upload,
    title: "Étape 1 : Télécharger vos résultats",
    description: "Accédez à la section Analyser, téléchargez votre PDF de résultats ou saisissez vos valeurs manuellement.",
    color: "raspberry",
  },
  {
    icon: FileText,
    title: "Étape 2 : Lab'IA analyse vos données",
    description: "Notre IA compare vos résultats aux plages de référence et identifie les valeurs anormales.",
    color: "green",
  },
  {
    icon: Headphones,
    title: "Étape 3 : Recevez des explications",
    description: "Lisez les explications simples en langage clair, avec visuals et options audio.",
    color: "blue",
  },
];

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  useScrollAnimations();

  const toggleFAQ = (index: number): void => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />

      <main id="main-content" className="bg-white py-16" role="main">
        <header className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h1 data-animate data-animate-variant="fade-up" className="text-4xl font-bold mb-4" id="page-title">
            Comment utiliser Lab'IA
          </h1>
          <p data-animate data-animate-variant="fade-up" data-animate-delay="0.1" className="text-lg text-gray-600" id="page-description">
            Découvrez comment utiliser Lab'IA pour comprendre vos résultats médicaux facilement.
          </p>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-12" aria-labelledby="guide-title">
          <h2 data-animate data-animate-variant="fade-up" className="text-3xl font-bold mb-10 text-center" id="guide-title">
            Guide de démarrage
          </h2>
          <div className="grid md:grid-cols-3 gap-8" role="list" data-animate-group>
            {GUIDES.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <article key={index} data-animate-child
                  className="flex flex-col border border-gray-100 rounded-2xl p-8 text-center items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-400 transition-all cursor-pointer hover:shadow-md"
                  tabIndex={0} role="listitem" aria-label={guide.title}
                >
                  <Icon
                    size={48}
                    className="rounded-2xl m-4 p-2"
                    style={{ color: "#1D4ED8", backgroundColor: "#DBEAFE" }}
                    aria-hidden="true"
                  />
                  <h3 className="font-bold text-xl mb-2">{guide.title}</h3>
                  <p className="text-gray-600">{guide.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12 bg-gray-50 rounded-xl" aria-labelledby="features-title">
          <h2 data-animate data-animate-variant="fade-up" className="text-3xl font-bold mb-10 text-center" id="features-title">
            Fonctionnalités principales
          </h2>
          <div className="grid md:grid-cols-2 gap-8" role="list" data-animate-group>
            <article data-animate-child className="bg-white p-8 rounded-xl shadow-sm" role="listitem">
              <div className="flex items-center gap-4 mb-4">
                <Upload size={32} className="text-raspberry-600" aria-hidden="true" />
                <h3 className="text-xl font-bold">Téléchargement de fichiers</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li>✓ Supportez les fichiers PDF jusqu'à 10 MB</li>
                <li>✓ Extraction automatique des valeurs</li>
                <li>✓ Reconnaissance optique de caractères (OCR)</li>
                <li>✓ Saisie manuelle disponible</li>
              </ul>
            </article>

            <article data-animate-child className="bg-white p-8 rounded-xl shadow-sm" role="listitem">
              <div className="flex items-center gap-4 mb-4">
                <FileText size={32} className="text-green-700" aria-hidden="true" />
                <h3 className="text-xl font-bold">Analyse IA</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li>✓ Comparaison avec les plages de référence</li>
                <li>✓ Identification des anomalies</li>
                <li>✓ Explications en langage simple</li>
                <li>✓ Suggestions de suivi médical</li>
              </ul>
            </article>

            <article data-animate-child className="bg-white p-8 rounded-xl shadow-sm" role="listitem">
              <div className="flex items-center gap-4 mb-4">
                <Headphones size={32} className="text-blue-700" aria-hidden="true" />
                <h3 className="text-xl font-bold">Support audio</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li>✓ Lectures audio de toutes les explications</li>
                <li>✓ Contrôle de la vitesse de lecture</li>
                <li>✓ Plusieurs langues disponibles</li>
                <li>✓ Accessible pour les utilisateurs malvoyants</li>
              </ul>
            </article>

            <article data-animate-child className="bg-white p-8 rounded-xl shadow-sm" role="listitem">
              <div className="flex items-center gap-4 mb-4">
                <Shield size={32} className="text-purple-700" aria-hidden="true" />
                <h3 className="text-xl font-bold">Sécurité &amp; Confidentialité</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li>✓ Chiffrement de bout en bout</li>
                <li>✓ Conformité GDPR</li>
                <li>✓ Pas de partage de données</li>
                <li>✓ Suppression automatique après 30 jours</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12" aria-labelledby="tips-title">
          <h2 data-animate data-animate-variant="fade-up" className="text-3xl font-bold mb-10 text-center" id="tips-title">
            Conseils d'utilisation
          </h2>
          <div className="grid md:grid-cols-2 gap-6" role="list" data-animate-group>
            {[
              { bg: "bg-blue-50",   border: "border-blue-500",   emoji: "💡", title: "Préparez votre document",  text: "Assurez-vous que votre PDF est lisible et en bon état. Les scans flous peuvent affecter la précision." },
              { bg: "bg-green-50",  border: "border-green-500",  emoji: "✓",  title: "Vérifiez les dates",       text: "Confirmez que les résultats sont récents. Les anciennes analyses peuvent ne pas être pertinentes." },
              { bg: "bg-purple-50", border: "border-purple-500", emoji: "📋", title: "Consultez votre médecin",  text: "Lab'IA complète, ne remplace pas une consultation médicale professionnelle." },
              { bg: "bg-orange-50", border: "border-orange-500", emoji: "🔒", title: "Protégez vos données",    text: "Ne partagez pas vos résultats avec des tiers. Lab'IA les protège automatiquement." },
            ].map(({ bg, border, emoji, title, text }) => (
              <article key={title} data-animate-child className={`${bg} border-l-4 ${border} p-6 rounded`} role="listitem" tabIndex={0}>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <span aria-hidden="true">{emoji}</span> {title}
                </h3>
                <p className="text-sm text-gray-700">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12" aria-labelledby="faq-title">
          <h2 data-animate data-animate-variant="fade-up" className="text-3xl font-bold mb-10 text-center" id="faq-title">
            Questions fréquemment posées
          </h2>
          <div className="space-y-4" role="region" aria-label="Questions fréquemment posées" aria-live="polite" data-animate-group>
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} data-animate-child className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-400 transition-all"
                  aria-expanded={openFAQ === index}
                  aria-controls={`faq-content-${index}`}
                  id={`faq-button-${index}`}
                >
                  <h3 className="text-lg font-semibold text-left flex items-center gap-2">
                    <HelpCircle size={20} className="text-raspberry-600" aria-hidden="true" />
                    {item.question}
                  </h3>
                  <ChevronDown
                    size={24}
                    className="text-gray-600 transition-transform shrink-0"
                    style={{ transform: openFAQ === index ? "rotate(180deg)" : "rotate(0deg)" }}
                    aria-hidden="true"
                  />
                </button>
                {openFAQ === index && (
                  <div id={`faq-content-${index}`} className="px-6 py-4 bg-gray-50 border-t" role="region" aria-labelledby={`faq-button-${index}`}>
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section data-animate data-animate-variant="zoom" className="bg-blue-50 mx-auto max-w-6xl px-6 py-12 rounded-2xl mt-12" aria-labelledby="contact-title">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4" id="contact-title">Besoin d'aide supplémentaire ?</h2>
            <p className="text-lg text-gray-700 mb-6">Contactez notre équipe support pour toute question ou problème.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href="mailto:support@labia.com"
                className="bg-raspberry-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-raspberry-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-400"
              >
                Envoyer un email
              </a>
              <a href="#"
                className="bg-white text-raspberry-700 border-2 border-raspberry-300 px-8 py-3 rounded-full font-semibold hover:bg-raspberry-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry-400"
              >
                Contacter le support
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
