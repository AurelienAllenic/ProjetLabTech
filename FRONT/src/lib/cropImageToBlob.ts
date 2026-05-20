import type { PixelCrop } from "react-image-crop";

/** Zone à noircir sur l’image (coordonnées en % de l’image source, 0–100). */
export type MaskRegionPct = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Rect = { x: number; y: number; width: number; height: number };

function intersectRect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const r = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const width = r - x;
  const height = bottom - y;
  if (width < 1 || height < 1) return null;
  return { x, y, width, height };
}

function maskPctToNaturalRect(m: Omit<MaskRegionPct, "id">, nw: number, nh: number): Rect {
  return {
    x: (m.x / 100) * nw,
    y: (m.y / 100) * nh,
    width: (m.w / 100) * nw,
    height: (m.h / 100) * nh,
  };
}

/**
 * Extrait la zone recadrée (pixels d’affichage → résolution naturelle) en JPEG pour le PDF.
 * `blackoutMasks` : rectangles noirs (confidentialité) en % de l’image entière, recoupés avec le recadrage.
 */
export async function getCroppedImageBlobFromPixelCrop(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  blackoutMasks: MaskRegionPct[] = [],
  quality = 0.92,
): Promise<Blob> {
  if (pixelCrop.width < 1 || pixelCrop.height < 1) {
    throw new Error("Zone de recadrage trop petite");
  }
  if (image.naturalWidth < 1 || image.naturalHeight < 1) {
    throw new Error("Image non chargée");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const sx = pixelCrop.x * scaleX;
  const sy = pixelCrop.y * scaleY;
  const sw = pixelCrop.width * scaleX;
  const sh = pixelCrop.height * scaleY;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas non disponible");
  }

  const outW = Math.max(1, Math.round(sw));
  const outH = Math.max(1, Math.round(sh));
  canvas.width = outW;
  canvas.height = outH;

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);

  if (blackoutMasks.length > 0) {
    const cropNatural: Rect = { x: sx, y: sy, width: sw, height: sh };
    const nw = image.naturalWidth;
    const nh = image.naturalHeight;
    ctx.fillStyle = "#000";
    for (const m of blackoutMasks) {
      const maskNat = maskPctToNaturalRect(m, nw, nh);
      const inter = intersectRect(maskNat, cropNatural);
      if (!inter) continue;
      const rx = inter.x - cropNatural.x;
      const ry = inter.y - cropNatural.y;
      ctx.fillRect(
        Math.floor(rx),
        Math.floor(ry),
        Math.max(1, Math.ceil(inter.width)),
        Math.max(1, Math.ceil(inter.height)),
      );
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Échec de l’export de l’image recadrée"));
      },
      "image/jpeg",
      quality,
    );
  });
}
