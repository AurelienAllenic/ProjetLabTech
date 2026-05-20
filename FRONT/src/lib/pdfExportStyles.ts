function safePaint(value: string, fallback: string): string {
  const v = value.trim();
  if (/oklch\s*\(/i.test(v)) return fallback;
  return v;
}

/** Interlignage et crénage lisibles une fois les feuilles retirées (évite le texte « tassé » dans le PDF). */
function applyPdfReadableTypography(el: HTMLElement, cs: CSSStyleDeclaration): void {
  const fs = parseFloat(cs.fontSize);
  if (!Number.isFinite(fs) || fs <= 0) return;

  const minLineRatio = 1.5;
  const lh = cs.lineHeight;
  if (lh === "normal" || lh === "") {
    el.style.lineHeight = `${Math.round(fs * minLineRatio * 10) / 10}px`;
  } else if (lh.endsWith("px")) {
    const lhPx = parseFloat(lh);
    el.style.lineHeight = `${Math.max(lhPx, Math.round(fs * minLineRatio * 10) / 10)}px`;
  } else {
    const unitless = parseFloat(lh);
    if (!Number.isNaN(unitless)) {
      el.style.lineHeight = String(Math.max(unitless, minLineRatio));
    } else {
      el.style.lineHeight = `${Math.round(fs * minLineRatio * 10) / 10}px`;
    }
  }

  const ls = cs.letterSpacing;
  if (ls === "normal" || ls === "") {
    el.style.letterSpacing = "0.02em";
    return;
  }
  const lsNum = parseFloat(ls);
  if (Number.isFinite(lsNum) && lsNum < 0) {
    el.style.letterSpacing = "0.02em";
    return;
  }
  el.style.letterSpacing = ls;
}

/** Retire les icônes Lucide (SVG décoratif) qui se superposent souvent au texte avec html2canvas. */
export function removePdfDecorativeLucideIcons(root: HTMLElement): void {
  root.querySelectorAll("span[aria-hidden='true']").forEach((span) => {
    if (span.querySelector("svg")) span.remove();
  });
}

/**
 * html2canvas ne gère pas les couleurs CSS modernes (ex. oklch) utilisées par Tailwind v4.
 * On applique les styles *calculés* (souvent en rgb/rgba) en inline et on retire les classes
 * pour que la capture ne repasse pas par les feuilles oklch.
 */
export function prepareDomSubtreeForHtml2Canvas(root: HTMLElement): void {
  const sync = (node: Element): void => {
    const cs = node instanceof HTMLElement ? window.getComputedStyle(node) : null;
    const csSvg = node instanceof SVGSVGElement ? window.getComputedStyle(node) : null;

    node.removeAttribute("class");

    if (node instanceof HTMLElement && cs) {
      node.style.color = safePaint(cs.color, "#111827");
      node.style.backgroundColor = safePaint(cs.backgroundColor, "transparent");
      node.style.backgroundImage = "none";
      node.style.borderImage = "none";
      node.style.filter = "none";
      node.style.backdropFilter = "none";
      node.style.boxShadow =
        cs.boxShadow === "none" || /oklch\s*\(/i.test(cs.boxShadow) ? "none" : cs.boxShadow;

      node.style.fontSize = cs.fontSize;
      node.style.fontWeight = cs.fontWeight;
      node.style.fontFamily = cs.fontFamily;
      node.style.fontStyle = cs.fontStyle;
      node.style.textDecoration = cs.textDecorationLine;

      applyPdfReadableTypography(node, cs);

      node.style.paddingTop = cs.paddingTop;
      node.style.paddingRight = cs.paddingRight;
      node.style.paddingBottom = cs.paddingBottom;
      node.style.paddingLeft = cs.paddingLeft;

      node.style.marginTop = cs.marginTop;
      node.style.marginRight = cs.marginRight;
      node.style.marginBottom = cs.marginBottom;
      node.style.marginLeft = cs.marginLeft;

      node.style.borderTopWidth = cs.borderTopWidth;
      node.style.borderRightWidth = cs.borderRightWidth;
      node.style.borderBottomWidth = cs.borderBottomWidth;
      node.style.borderLeftWidth = cs.borderLeftWidth;
      node.style.borderTopStyle = cs.borderTopStyle;
      node.style.borderRightStyle = cs.borderRightStyle;
      node.style.borderBottomStyle = cs.borderBottomStyle;
      node.style.borderLeftStyle = cs.borderLeftStyle;
      node.style.borderTopColor = safePaint(cs.borderTopColor, "#e5e7eb");
      node.style.borderRightColor = safePaint(cs.borderRightColor, "#e5e7eb");
      node.style.borderBottomColor = safePaint(cs.borderBottomColor, "#e5e7eb");
      node.style.borderLeftColor = safePaint(cs.borderLeftColor, "#e5e7eb");

      node.style.borderRadius = cs.borderRadius;
      node.style.display = cs.display;
      node.style.flexDirection = cs.flexDirection;
      node.style.flexWrap = cs.flexWrap;
      node.style.justifyContent = cs.justifyContent;
      node.style.alignItems = cs.alignItems;
      node.style.alignContent = cs.alignContent;
      node.style.alignSelf = cs.alignSelf;
      node.style.gap = cs.gap;
      node.style.rowGap = cs.rowGap;
      node.style.columnGap = cs.columnGap;
      node.style.flex = cs.flex;
      node.style.flexGrow = cs.flexGrow;
      node.style.flexShrink = cs.flexShrink;
      node.style.flexBasis = cs.flexBasis;
      node.style.minWidth = cs.minWidth;
      node.style.minHeight = cs.minHeight;
      node.style.maxWidth = cs.maxWidth;
      node.style.overflow = cs.overflow;
      node.style.position = cs.position;
      node.style.order = cs.order;
      node.style.textAlign = cs.textAlign;
      node.style.verticalAlign = cs.verticalAlign;
      node.style.whiteSpace = cs.whiteSpace;
      node.style.wordBreak = cs.wordBreak;

      node.style.listStyleType = cs.listStyleType;
      node.style.listStylePosition = cs.listStylePosition;
    }

    for (const child of node.children) {
      sync(child);
    }

    if (node instanceof SVGSVGElement && csSvg) {
      node.style.display = csSvg.display === "none" ? "none" : "block";
      node.style.width = csSvg.width;
      node.style.height = csSvg.height;
      node.style.flexShrink = csSvg.flexShrink;
      node.style.overflow = "visible";
    }
  };

  sync(root);
}
