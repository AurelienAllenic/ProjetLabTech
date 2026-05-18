import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * useLayoutEffect (synchrone, avant le paint) : les éléments sont
 * cachés AVANT que le navigateur peigne la page → pas de flash.
 *
 * Variantes disponibles via data-animate-variant :
 *   "fade-up"    (défaut) : monte depuis le bas
 *   "fade-left"  : entre depuis la gauche
 *   "fade-right" : entre depuis la droite
 *   "zoom"       : zoom léger + montée
 */
export function useScrollAnimations() {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      /* ── Éléments individuels ─────────────────────────── */
      document.querySelectorAll("[data-animate]").forEach((el) => {
        const variant = el.dataset.animateVariant || "fade-up";
        const delay   = parseFloat(el.dataset.animateDelay || "0");

        const from = { opacity: 0 };
        if (variant === "fade-up")    { from.y = 50; }
        if (variant === "fade-left")  { from.x = -50; }
        if (variant === "fade-right") { from.x = 50; }
        if (variant === "zoom")       { from.scale = 0.88; from.y = 24; }

        gsap.fromTo(
          el,
          from,
          {
            opacity: 1,
            y: 0, x: 0, scale: 1,
            duration: 0.75,
            ease: "power3.out",
            delay,
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              // play à l'entrée, reset à la sortie → rejoue à chaque passage
              toggleActions: "play none none reset",
            },
          }
        );
      });

      /* ── Groupes (stagger) ────────────────────────────── */
      document.querySelectorAll("[data-animate-group]").forEach((group) => {
        const children = group.querySelectorAll("[data-animate-child]");
        if (!children.length) return;

        gsap.fromTo(
          children,
          { opacity: 0, y: 44 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
            stagger: 0.13,
            scrollTrigger: {
              trigger: group,
              start: "top 88%",
              toggleActions: "play none none reset",
            },
          }
        );
      });

      // Recalcule les positions après que React a fini de poser le DOM
      ScrollTrigger.refresh();
    });

    return () => ctx.revert();
  }, []);
}
