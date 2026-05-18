import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useScrollAnimations } from "../hooks/useScrollAnimations";

import {
  Import,
  Brain,
  FilePlusCorner,
  File,
  Keyboard,
  Eye,
  Headphones,
  Accessibility,
  Lock,
  Shield,
  UploadCloud,
  PenLine,
  X,
  ArrowRight,
} from "lucide-react";

const ACCESSIBILITY_DETAILS = [
  {
    icon: Eye,
    label: "Accessibilité visuelle",
    short: "Contrastes élevés, tailles adaptables.",
    color: "text-raspberry-600 bg-raspberry-100",
    details: {
      titre: "Accessibilité visuelle",
      description:
        "Lab'IA a été conçu pour être utilisable par des personnes ayant des déficiences visuelles partielles ou totales.",
      points: [
        "Contrastes de couleurs conformes WCAG 2.2 AA (ratio ≥ 4,5:1 pour le texte)",
        "Tailles de texte minimales de 16px, agrandissables sans perte de contenu",
        "Icônes décoratives masquées aux lecteurs d'écran (aria-hidden)",
        "Alternatives textuelles sur toutes les images informatives",
        "Mode sombre compatible (via les préférences système)",
      ],
    },
  },
  {
    icon: Headphones,
    label: "Assistance audio",
    short: "Lecteur audio intégré pour chaque résultat.",
    color: "text-raspberry-600 bg-raspberry-100",
    details: {
      titre: "Assistance audio",
      description:
        "Chaque résultat médical peut être écouté grâce au lecteur audio intégré, idéal pour les personnes malvoyantes ou dyslexiques.",
      points: [
        "Synthèse vocale des explications médicales",
        "Contrôle de la vitesse de lecture (0,5x à 2x)",
        "Mise en pause, reprise et navigation entre sections",
        "Compatible avec les lecteurs d'écran (NVDA, JAWS, VoiceOver)",
        "Transcriptions textuelles disponibles en parallèle",
      ],
    },
  },
  {
    icon: Keyboard,
    label: "Navigation clavier",
    short: "Accès complet via le clavier.",
    color: "text-raspberry-600 bg-raspberry-100",
    details: {
      titre: "Navigation clavier",
      description:
        "L'intégralité de l'application est utilisable sans souris, uniquement avec le clavier.",
      points: [
        "Lien d'évitement « Aller au contenu principal » dès le premier Tab",
        "Tous les éléments interactifs accessibles par Tab / Shift+Tab",
        "Indicateurs de focus visibles et conformes WCAG 2.2",
        "Raccourcis clavier pour les actions principales",
        "Gestion des flèches dans les groupes de boutons radio",
      ],
    },
  },
  {
    icon: Accessibility,
    label: "Design inclusif",
    short: "Conçu pour tous les utilisateurs.",
    color: "text-raspberry-600 bg-raspberry-100",
    details: {
      titre: "Design inclusif",
      description:
        "Lab'IA applique les principes du design universel pour s'adapter à toutes les situations et tous les profils.",
      points: [
        "Conformité WCAG 2.2 niveau AA et RGAA 4.1",
        "Zones de clic larges (minimum 44×44 px) pour les utilisateurs moteurs",
        "Langage simple et clair (niveau B1 recommandé)",
        "Compatibilité avec les technologies d'assistance (loupes, commutateurs)",
        "Pas de contenu qui clignote ou bouge sans contrôle utilisateur",
      ],
    },
  },
];

function AccessibilityModal({ feature, onClose }) {
  // Bloquer le scroll de la page quand la modale est ouverte
  useEffect(() => {
    if (feature) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [feature]);

  // Fermer avec Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!feature) return null;
  const Icon = feature.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm
                 animate-[fadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative
                   animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 rounded-full p-1 transition"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feature.color}`}>
          <Icon size={24} aria-hidden="true" />
        </div>

        <h2 id="modal-title" className="text-xl font-bold text-gray-900 mb-2">
          {feature.details.titre}
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {feature.details.description}
        </p>

        <ul className="flex flex-col gap-3">
          {feature.details.points.map((point, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-raspberry-100 text-raspberry-600 flex items-center justify-center shrink-0 text-xs font-bold">
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-gray-400">
          Conforme aux normes WCAG 2.2 AA et RGAA 4.1
        </p>
      </div>
    </div>
  );
}

export default function LabIALanding() {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(null);

  useScrollAnimations();

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />

      {/* Hero */}
      <main id="main-content" role="main" aria-label="Contenu principal de Lab'IA">
        <section
          className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-blue-100 h-screen flex items-center"
          aria-labelledby="hero-title"
        >
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] bg-blue-200 opacity-30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -left-16 w-[320px] h-[320px] bg-blue-100 opacity-40 rounded-full blur-2xl pointer-events-none" />

          <div className="relative w-full max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center pt-16">
            {/* Texte hero animé */}
            <div className="flex flex-col gap-6">
              <span
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.05"
                className="inline-flex items-center gap-2 text-xs font-semibold text-raspberry-600 bg-raspberry-100 px-3 py-1 rounded-full w-max"
              >
                ✦ Intelligence artificielle médicale
              </span>

              <h1
                id="hero-title"
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.15"
                className="text-5xl font-bold text-gray-900 leading-tight"
              >
                Votre santé,{" "}
                <span className="text-raspberry-600">comprise</span>{" "}
                simplement
              </h1>

              <p
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.25"
                className="text-base text-gray-500 max-w-md leading-relaxed"
              >
                Lab'IA traduit vos rapports médicaux complexes en explications
                claires et accessibles. Aucun diplôme médical n'est nécessaire.
              </p>

              <div
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.3"
                className="flex flex-col gap-2 text-sm text-gray-500"
                role="list"
                aria-label="Avantages de Lab'IA"
              >
                {[
                  "Sécurisé et conforme au RGPD",
                  "Complètement accessible",
                  "Gratuit et simple d'utilisation",
                ].map((item) => (
                  <span key={item} role="listitem" className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-raspberry-100 text-raspberry-600 flex items-center justify-center text-xs font-bold">✓</span>
                    {item}
                  </span>
                ))}
              </div>

              <div
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.4"
                className="flex gap-4 mt-2 flex-wrap"
                role="group"
                aria-label="Choisissez votre mode d'analyse"
              >
                <button
                  type="button"
                  onClick={() => navigate("/upload")}
                  aria-label="Téléverser un rapport PDF"
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-raspberry-300 transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 group"
                >
                  <span className="w-10 h-10 rounded-xl bg-raspberry-100 text-raspberry-600 flex items-center justify-center shrink-0 group-hover:bg-raspberry-200 transition">
                    <UploadCloud size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Téléverser un PDF</span>
                    <span className="block text-xs text-gray-400 mt-0.5">Analyse automatique</span>
                  </span>
                  <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-raspberry-500 transition" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/manual")}
                  aria-label="Saisir les résultats manuellement"
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-raspberry-300 transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 group"
                >
                  <span className="w-10 h-10 rounded-xl bg-blue-100 text-raspberry-700 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition">
                    <PenLine size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Saisie manuelle</span>
                    <span className="block text-xs text-gray-400 mt-0.5">Entrez vos valeurs</span>
                  </span>
                  <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-raspberry-500 transition" aria-hidden="true" />
                </button>
              </div>

              <p
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.5"
                className="text-xs text-gray-400 flex items-center gap-2"
              >
                <span className="flex -space-x-2">
                  {["👨‍⚕️", "👩‍⚕️", "🧑‍⚕️"].map((e, i) => (
                    <span key={i} className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm border-2 border-white">{e}</span>
                  ))}
                </span>
                20k+ utilisateurs satisfaits
              </p>
            </div>

            {/* Image hero */}
            <div
              data-animate
              data-animate-variant="fade-left"
              data-animate-delay="0.2"
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=928&auto=format&fit=crop"
                alt="Professionnel de santé souriant"
                className="rounded-2xl shadow-xl w-full object-cover max-h-[460px]"
              />
              <div className="absolute bottom-10 -right-6 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-base">✓</span>
                Analyse en quelques secondes
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-white py-20" aria-labelledby="how-title">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2
                id="how-title"
                data-animate
                data-animate-variant="fade-up"
                className="text-3xl font-bold text-gray-900 mb-3"
              >
                Comment ça marche ?
              </h2>
              <p
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.1"
                className="text-gray-400 text-sm"
              >
                Trois étapes simples pour comprendre votre santé
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6" role="list" data-animate-group>
              {[
                { icon: Import,         step: "01", title: "Téléversez vos résultats",   desc: "Téléchargez votre PDF ou saisissez les valeurs manuellement. Vos données sont chiffrées et sécurisées." },
                { icon: Brain,          step: "02", title: "Analyse par l'IA",           desc: "Notre IA compare vos résultats aux plages de référence médicales." },
                { icon: FilePlusCorner, step: "03", title: "Recevez vos explications",   desc: "Des explications simples en langage courant, avec des visuels et options audio." },
              ].map(({ icon: Icon, step, title, desc }) => (
                <article
                  key={step}
                  data-animate-child
                  className="relative bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400"
                  tabIndex="0"
                  role="listitem"
                >
                  <span className="absolute top-5 right-5 text-xs font-bold text-gray-200">{step}</span>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-raspberry-100 text-raspberry-600">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section id="accessibility" className="bg-blue-50 py-20" aria-labelledby="accessibility-title">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2
                id="accessibility-title"
                data-animate
                data-animate-variant="fade-up"
                className="text-3xl font-bold text-gray-900 mb-3"
              >
                Conçu pour tous
              </h2>
              <p
                data-animate
                data-animate-variant="fade-up"
                data-animate-delay="0.1"
                className="text-gray-400 text-sm"
              >
                Conforme aux normes WCAG 2.2 AA et RGAA 4.1 — cliquez pour en savoir plus
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-5" role="list" data-animate-group>
              {ACCESSIBILITY_DETAILS.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.label}
                    type="button"
                    data-animate-child
                    onClick={() => setOpenModal(feature)}
                    role="listitem"
                    aria-label={`En savoir plus sur : ${feature.label}`}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-raspberry-400 group cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition group-hover:scale-110 ${feature.color}`}>
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.label}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{feature.short}</p>
                    <span className="mt-3 text-xs text-raspberry-500 font-medium opacity-0 group-hover:opacity-100 transition">
                      En savoir plus →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
            <img
              data-animate
              data-animate-variant="fade-right"
              src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1170&auto=format&fit=crop"
              alt="Sécurité des données médicales"
              className="rounded-2xl shadow-md"
            />
            <div>
              <span
                data-animate
                data-animate-variant="fade-left"
                data-animate-delay="0.05"
                className="inline-flex items-center gap-2 text-xs font-semibold text-raspberry-600 bg-raspberry-100 px-3 py-1 rounded-full mb-5"
              >
                ✦ Sécurité maximale
              </span>
              <h2
                data-animate
                data-animate-variant="fade-left"
                data-animate-delay="0.1"
                className="text-3xl font-bold text-gray-900 mb-6 leading-tight"
              >
                Vos données de santé<br />sont protégées
              </h2>
              <ul className="flex flex-col gap-4" data-animate-group>
                {[
                  { icon: Shield, color: "bg-green-100 text-green-600", label: "Conforme au RGPD" },
                  { icon: Lock,   color: "bg-blue-100 text-raspberry-600", label: "Chiffrement de bout en bout" },
                  { icon: File,   color: "bg-purple-100 text-purple-600", label: "Contrôle total de vos données" },
                ].map(({ icon: Icon, color, label }) => (
                  <li key={label} data-animate-child className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="bg-linear-to-r from-raspberry-600 to-raspberry-700 text-white py-20 text-center"
        >
          <div className="max-w-2xl mx-auto px-6">
            <h2
              data-animate
              data-animate-variant="zoom"
              className="text-3xl font-bold mb-4 leading-tight"
            >
              Prêt à comprendre<br />votre santé ?
            </h2>
            <p
              data-animate
              data-animate-variant="fade-up"
              data-animate-delay="0.1"
              className="mb-8 text-blue-100 text-sm"
            >
              Rejoignez des milliers d'utilisateurs qui font confiance à Lab'IA.
            </p>
            <div
              data-animate
              data-animate-variant="fade-up"
              data-animate-delay="0.2"
              className="flex gap-4 justify-center flex-wrap"
            >
              <button
                type="button"
                onClick={() => navigate("/upload")}
                className="flex items-center gap-2 bg-white text-raspberry-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white shadow-md"
              >
                <UploadCloud size={18} aria-hidden="true" /> Téléverser un PDF
              </button>
              <button
                type="button"
                onClick={() => navigate("/manual")}
                className="flex items-center gap-2 bg-white/10 text-white border border-white/30 px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <PenLine size={18} aria-hidden="true" /> Saisie manuelle
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <AccessibilityModal
        feature={openModal}
        onClose={() => setOpenModal(null)}
      />
    </div>
  );
}
