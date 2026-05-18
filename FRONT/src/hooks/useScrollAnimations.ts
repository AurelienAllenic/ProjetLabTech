import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type AnimateVariant = "fade-up" | "fade-left" | "fade-right" | "zoom";

function buildFrom(variant: AnimateVariant): gsap.TweenVars {
  const from: gsap.TweenVars = { opacity: 0 };
  if (variant === "fade-up")    { from.y = 50; }
  if (variant === "fade-left")  { from.x = -50; }
  if (variant === "fade-right") { from.x = 50; }
  if (variant === "zoom")       { from.scale = 0.88; from.y = 24; }
  return from;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useScrollAnimations(): void {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      document
        .querySelectorAll<HTMLElement>("[data-animate], [data-animate-child]")
        .forEach((el) => { el.style.opacity = "1"; });
      return;
    }

    const ctx = gsap.context(() => {

      /* ── Éléments individuels ─────────────────────────── */
      document.querySelectorAll<HTMLElement>("[data-animate]").forEach((el) => {
        const variant = (el.dataset.animateVariant ?? "fade-up") as AnimateVariant;
        const delay   = parseFloat(el.dataset.animateDelay ?? "0");
        const from    = buildFrom(variant);

        // Tween en pause : on le contrôle via les callbacks ScrollTrigger
        const tween = gsap.fromTo(el, from, {
          opacity: 1,
          y: 0, x: 0, scale: 1,
          duration: 0.75,
          ease: "power3.out",
          delay,
          paused: true,
        });

        ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          // Rejoue à chaque entrée dans le viewport (depuis le bas OU le haut)
          onEnter:      () => { gsap.set(el, from); tween.restart(); },
          onEnterBack:  () => { gsap.set(el, from); tween.restart(); },
          // Réinitialise instantanément quand l'élément quitte le viewport
          onLeave:      () => { tween.pause(); gsap.set(el, from); },
          onLeaveBack:  () => { tween.pause(); gsap.set(el, from); },
        });
      });

      /* ── Groupes (stagger) ────────────────────────────── */
      document.querySelectorAll<HTMLElement>("[data-animate-group]").forEach((group) => {
        const children = Array.from(
          group.querySelectorAll<HTMLElement>("[data-animate-child]")
        );
        if (!children.length) return;

        const childFrom: gsap.TweenVars = { opacity: 0, y: 44 };

        const tween = gsap.fromTo(children, childFrom, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.13,
          paused: true,
        });

        ScrollTrigger.create({
          trigger: group,
          start: "top 88%",
          onEnter:     () => { gsap.set(children, childFrom); tween.restart(); },
          onEnterBack: () => { gsap.set(children, childFrom); tween.restart(); },
          onLeave:     () => { tween.pause(); gsap.set(children, childFrom); },
          onLeaveBack: () => { tween.pause(); gsap.set(children, childFrom); },
        });
      });

      ScrollTrigger.refresh();
    });

    return () => { ctx.revert(); };
  }, []);
}
