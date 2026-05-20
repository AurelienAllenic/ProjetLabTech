import type { ApiElement } from "../types";

/** Synthèse finale pour le flux saisie manuelle (sans appel Mistral). */
export function buildManualConclusion(elements: ApiElement[]): string {
  if (elements.length === 0) {
    return "Aucune valeur n’a été analysée. Complétez la saisie pour obtenir une synthèse.";
  }

  const abnormal = elements.filter((el) => {
    const c = (el.categorie ?? "").trim().toLowerCase();
    return c !== "normal" && c !== "correct" && c !== "ok";
  });

  if (abnormal.length === 0) {
    return [
      "D’après les intervalles de référence que vous avez indiqués, les valeurs saisies se situent dans les plages attendues.",
      "Ce résumé reste purement indicatif : votre médecin ou votre laboratoire pourra les interpréter dans votre contexte personnel et décider de toute suite éventuelle.",
    ].join(" ");
  }

  const names = abnormal.map((e) => {
    const n = e.nom?.trim();
    return n && n.length > 0 ? n : "Paramètre";
  });
  const liste =
    names.length <= 4 ? names.join(", ") : `${names.slice(0, 4).join(", ")} et ${names.length - 4} autre(s)`;

  const hasHigh = abnormal.some((e) =>
    /élevé|eleve|supérieur|superieur|haut|high/i.test(e.categorie ?? ""),
  );
  const hasLow = abnormal.some((e) => /bas|faible|inférieur|inferieur|low/i.test(e.categorie ?? ""));

  let phraseEcarts =
    "Une ou plusieurs valeurs sortent des plages de référence que vous avez renseignées.";
  if (hasHigh && !hasLow) {
    phraseEcarts =
      "Au moins une valeur apparaît au-dessus de l’intervalle de référence indiqué pour les analyses concernées.";
  } else if (hasLow && !hasHigh) {
    phraseEcarts =
      "Au moins une valeur apparaît en dessous de l’intervalle de référence indiqué pour les analyses concernées.";
  } else if (hasHigh && hasLow) {
    phraseEcarts =
      "Certaines valeurs semblent au-dessus de la référence et d’autres en dessous selon les analyses concernées.";
  }

  return [
    phraseEcarts,
    `Paramètres à surveiller dans cette lecture automatique : ${liste}.`,
    "Plusieurs causes possibles peuvent expliquer ces écarts ; seul un professionnel de santé peut interpréter ces résultats de façon fiable et proposer une suite adaptée.",
  ].join(" ");
}
