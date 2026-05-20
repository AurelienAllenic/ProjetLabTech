import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type SyntheticEvent,
  type WheelEvent,
} from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  type Crop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ImageBlackoutMasksOverlay from "./ImageBlackoutMasksOverlay";
import UiButton from "./UiButton";
import { getCroppedImageBlobFromPixelCrop, type MaskRegionPct } from "../lib/cropImageToBlob";

export interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  onDismiss: () => void;
  /** Image entière convertie en PDF (sans recadrage). */
  onUseFullImage: () => void;
  /** Zone recadrée prête pour la conversion PDF. */
  onCropped: (blob: Blob) => void;
}

const INITIAL_COVER_PERCENT = 90;
/** 1× = image entière contenue dans la zone (avec marge). Plus petit = dézoom, plus grand = grossir. */
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.05;
const CONTAINER_PAD_PX = 32;
const DEFAULT_NEW_MASK_W_PCT = 28;
const DEFAULT_NEW_MASK_H_PCT = 22;
const MASK_MIN_PCT = 3;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function createMaskCenteredInViewport(
  containerEl: HTMLElement,
  imgEl: HTMLImageElement,
): MaskRegionPct {
  const cr = containerEl.getBoundingClientRect();
  const ir = imgEl.getBoundingClientRect();
  const iw = Math.max(ir.width, 1);
  const ih = Math.max(ir.height, 1);
  const centerVx = cr.left + cr.width / 2;
  const centerVy = cr.top + cr.height / 2;
  let relX = centerVx - ir.left;
  let relY = centerVy - ir.top;
  relX = clamp(relX, 0, iw);
  relY = clamp(relY, 0, ih);
  const pctCx = (relX / iw) * 100;
  const pctCy = (relY / ih) * 100;

  let w = Math.max(MASK_MIN_PCT, Math.min(100, DEFAULT_NEW_MASK_W_PCT));
  let h = Math.max(MASK_MIN_PCT, Math.min(100, DEFAULT_NEW_MASK_H_PCT));
  let x = pctCx - w / 2;
  let y = pctCy - h / 2;
  x = clamp(x, 0, 100 - w);
  y = clamp(y, 0, 100 - h);
  return {
    id: crypto.randomUUID(),
    x,
    y,
    w,
    h,
  };
}

/** Taille d’affichage à zoom 1 : tout le document visible dans le conteneur (jamais agrandi au-delà du natif). */
function computeFitAtZoomOne(
  naturalW: number,
  naturalH: number,
  containerW: number,
  containerH: number,
): { w: number; h: number } {
  if (naturalW < 1 || naturalH < 1) {
    return { w: 32, h: 32 };
  }
  const availW = Math.max(48, containerW - CONTAINER_PAD_PX);
  const availH = Math.max(48, containerH - CONTAINER_PAD_PX);
  const scale = Math.min(availW / naturalW, availH / naturalH, 1);
  return {
    w: Math.max(32, Math.round(naturalW * scale)),
    h: Math.max(32, Math.round(naturalH * scale)),
  };
}

export default function ImageCropModal({
  open,
  imageSrc,
  onDismiss,
  onUseFullImage,
  onCropped,
}: ImageCropModalProps): ReactElement | null {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  /** Dimensions du document à zoom 1 (tenu dans le cadre). */
  const fitBaseRef = useRef<{ w: number; h: number } | null>(null);
  const zoomRef = useRef(1);
  const [layoutReady, setLayoutReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState<Crop>();
  const [completedCropPx, setCompletedCropPx] = useState<PixelCrop | null>(null);
  const [busy, setBusy] = useState(false);
  const [maskEditMode, setMaskEditMode] = useState(false);
  const [masks, setMasks] = useState<MaskRegionPct[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);

  const syncPixelsFromCrop = useCallback((c: Crop, img: HTMLImageElement): void => {
    const iw = img.width;
    const ih = img.height;
    if (iw < 1 || ih < 1) return;
    setCompletedCropPx(convertToPixelCrop(c, iw, ih));
  }, []);

  const measureAndInitCrop = useCallback((img: HTMLImageElement): void => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box || img.naturalWidth < 1 || img.naturalHeight < 1) return;

    const fit = computeFitAtZoomOne(img.naturalWidth, img.naturalHeight, box.width, box.height);
    fitBaseRef.current = fit;

    const centered = centerCrop(
      {
        unit: "%",
        width: INITIAL_COVER_PERCENT,
        height: INITIAL_COVER_PERCENT,
      },
      fit.w,
      fit.h,
    );
    setCrop(centered);
    setCompletedCropPx(convertToPixelCrop(centered, fit.w, fit.h));
    setLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  /** Supprimer la zone sélectionnée avec Retour / Suppr (mode masques). */
  useEffect(() => {
    if (!open || !maskEditMode || !selectedMaskId || busy) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      e.preventDefault();
      setMasks((prev) => prev.filter((m) => m.id !== selectedMaskId));
      setSelectedMaskId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, maskEditMode, selectedMaskId, busy]);

  useEffect(() => {
    if (!open) return;
    setCrop(undefined);
    setCompletedCropPx(null);
    setBusy(false);
    setZoom(1);
    setLayoutReady(false);
    fitBaseRef.current = null;
    zoomRef.current = 1;
    setMaskEditMode(false);
    setMasks([]);
    setSelectedMaskId(null);
  }, [open, imageSrc]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  /** Recalcul « zoom 1 » si la fenêtre ou le panneau change de taille. */
  useEffect(() => {
    if (!open || !layoutReady) return;
    const el = containerRef.current;
    const img = imgRef.current;
    if (!el || !img?.naturalWidth) return;

    const ro = new ResizeObserver(() => {
      const box = el.getBoundingClientRect();
      if (box.width < 8 || box.height < 8) return;
      const fit = computeFitAtZoomOne(img.naturalWidth, img.naturalHeight, box.width, box.height);
      fitBaseRef.current = fit;
      const z = zoomRef.current;
      const iw = Math.max(32, Math.round(fit.w * z));
      const ih = Math.max(32, Math.round(fit.h * z));
      const centered = centerCrop(
        { unit: "%", width: INITIAL_COVER_PERCENT, height: INITIAL_COVER_PERCENT },
        iw,
        ih,
      );
      setCrop(centered);
      setCompletedCropPx(convertToPixelCrop(centered, iw, ih));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, layoutReady, imageSrc]);

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>): void => {
    const img = e.currentTarget;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measureAndInitCrop(img);
      });
    });
  };

  const onCropChange = (_pixel: PixelCrop, percentCrop: PercentCrop): void => {
    setCrop(percentCrop);
    const el = imgRef.current;
    if (el) syncPixelsFromCrop(percentCrop, el);
  };

  const onCropComplete = (pixelCrop: PixelCrop): void => {
    setCompletedCropPx(pixelCrop);
  };

  useEffect(() => {
    if (!layoutReady || !crop) return;
    const img = imgRef.current;
    if (!img || img.width < 1 || img.height < 1) return;
    setCompletedCropPx(convertToPixelCrop(crop, img.width, img.height));
  }, [zoom, layoutReady, crop]);

  /** Molette seule = défilement du panneau ; Ctrl ou ⌘ + molette = zoom (évite de bloquer le scroll). */
  const onWheelZoom = (e: WheelEvent<HTMLDivElement>): void => {
    if (!layoutReady || busy) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP * 2 : ZOOM_STEP * 2;
    setZoom((z) => clamp(Number((z + delta).toFixed(3)), ZOOM_MIN, ZOOM_MAX));
  };

  const addMask = (): void => {
    const img = imgRef.current;
    const sc = containerRef.current;
    if (!layoutReady || !img || !sc || busy || img.width < 2 || img.height < 2) return;
    const next = createMaskCenteredInViewport(sc, img);
    setMasks((prev) => [...prev, next]);
    setSelectedMaskId(next.id);
  };

  if (!open) return null;

  const base = fitBaseRef.current;
  const displayW = base && layoutReady ? Math.max(32, Math.round(base.w * zoom)) : undefined;
  const displayH = base && layoutReady ? Math.max(32, Math.round(base.h * zoom)) : undefined;

  const handleConfirmCrop = (): void => {
    const img = imgRef.current;
    if (!img || !completedCropPx) return;
    setBusy(true);
    void (async () => {
      try {
        const blob = await getCroppedImageBlobFromPixelCrop(img, completedCropPx, masks);
        onCropped(blob);
      } catch {
        window.alert("Impossible de recadrer cette image. Réessayez ou utilisez « Sans recadrage ».");
      } finally {
        setBusy(false);
      }
    })();
  };

  const rcClass = ["labia-image-crop-scope"]
    .concat(maskEditMode ? ["labia-mask-edit-mode"] : [])
    .join(" ");

  return (
    <div
      className="fixed inset-0 z-220 flex items-stretch justify-center sm:items-center p-0 sm:p-4 md:p-6 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onDismiss();
      }}
    >
      <div
        className={[
          "bg-white flex flex-col min-h-0 w-full overflow-hidden border border-gray-200 shadow-2xl",
          "h-dvh max-h-dvh rounded-none",
          "sm:rounded-2xl sm:h-[min(92vh,920px)] sm:max-h-[92vh] sm:w-[min(96vw,72rem)] sm:max-w-[min(96vw,72rem)]",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100">
          <h2 id={titleId} className="text-base sm:text-lg font-semibold text-gray-900">
            Recadrer et masquer des zones
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-snug">
            Le <strong className="font-medium text-gray-700">cadre blanc</strong> définit la zone exportée en PDF. Activez le mode masques pour ajouter des{" "}
            <strong className="font-medium text-gray-700">rectangles noirs</strong> (plusieurs possibles) sur le document ; chaque nouvelle zone apparaît au <strong className="font-medium text-gray-700">centre de la zone visible</strong> (utile si vous avez zoomé ou défilé). Décochez le mode masques pour repositionner le <strong className="font-medium text-gray-700">cadre blanc</strong>.{" "}
            <strong>1×</strong> = document entier visible. La molette fait défiler le document ; tenez <strong>Ctrl</strong> (Windows/Linux) ou <strong>⌘</strong> (Mac) en scrollant pour zoomer, ou utilisez le curseur ci-dessous.
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative flex-1 min-h-0 min-w-0 overflow-auto overscroll-contain bg-gray-950"
          onWheel={onWheelZoom}
        >
          {/* w-max + min-w-full + min-h-full : zone de défilement aussi large/haute que le doc zoomé ; centre si le doc est plus petit que la fenêtre */}
          <div className="flex w-max min-w-full min-h-full shrink-0 items-center justify-center p-3 sm:p-4 box-border">
            <div className="shrink-0 leading-none">
              <ReactCrop
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropComplete}
                minWidth={16}
                minHeight={16}
                keepSelection
                ruleOfThirds
                className={rcClass}
              >
                <div className="relative inline-block leading-none">
                  <img
                    ref={imgRef}
                    crossOrigin="anonymous"
                    alt=""
                    src={imageSrc}
                    onLoad={onImageLoad}
                    className={
                      layoutReady && base
                        ? "block select-none max-w-none shrink-0"
                        : "block max-h-[min(40dvh,480px)] sm:max-h-[min(40vh,420px)] w-auto max-w-full mx-auto select-none object-contain opacity-0 pointer-events-none"
                    }
                    style={
                      layoutReady && displayW !== undefined && displayH !== undefined
                        ? { width: displayW, height: displayH }
                        : undefined
                    }
                    draggable={false}
                  />
                  <ImageBlackoutMasksOverlay
                    masks={masks}
                    onMasksChange={setMasks}
                    selectedId={selectedMaskId}
                    onSelect={setSelectedMaskId}
                    disabled={!layoutReady || busy || !maskEditMode}
                  />
                </div>
              </ReactCrop>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 py-3 sm:px-5 flex flex-col gap-3 border-t border-gray-100 bg-white">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4">
            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 cursor-pointer select-none min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                className="size-4 rounded border-gray-300 accent-raspberry-600"
                checked={maskEditMode}
                onChange={(e) => {
                  setMaskEditMode(e.target.checked);
                  setSelectedMaskId(null);
                }}
                disabled={!layoutReady || busy}
              />
              Mode masques (plusieurs cadres noirs)
            </label>
            {maskEditMode ? (
              <div className="flex flex-wrap gap-2">
                <UiButton
                  type="button"
                  bg="white"
                  text="raspberry"
                  className="py-2 px-3 text-sm justify-center"
                  disabled={!layoutReady || busy}
                  onClick={addMask}
                >
                  + Zone à masquer
                </UiButton>
                <UiButton
                  type="button"
                  bg="white"
                  text="raspberry"
                  className="py-2 px-3 text-sm justify-center"
                  disabled={!layoutReady || busy || !selectedMaskId}
                  onClick={() => {
                    if (!selectedMaskId) return;
                    setMasks((prev) => prev.filter((m) => m.id !== selectedMaskId));
                    setSelectedMaskId(null);
                  }}
                >
                  Supprimer la zone
                </UiButton>
              </div>
            ) : null}
          </div>
          {masks.length > 0 && !maskEditMode ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
              {masks.length} zone{masks.length > 1 ? "s" : ""} masquée{masks.length > 1 ? "s" : ""} seront appliquée{masks.length > 1 ? "s" : ""} à l’export. Cochez « Mode masques » pour les déplacer ou les redimensionner.
            </p>
          ) : null}

          <label htmlFor="image-crop-zoom" className="text-xs font-medium text-gray-600">
            Zoom du document ({Number(zoom.toFixed(2))}× — 1× = document entier visible). Molette seule : faire défiler · Ctrl / ⌘ + molette : zoomer.
          </label>
          <input
            id="image-crop-zoom"
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            disabled={!layoutReady}
            aria-valuemin={ZOOM_MIN}
            aria-valuemax={ZOOM_MAX}
            className="w-full min-h-[44px] accent-raspberry-600 py-2 disabled:opacity-40"
          />
        </div>

        <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pb-4 sm:pt-3 flex flex-col-reverse sm:flex-row flex-wrap gap-2 sm:gap-3 justify-stretch sm:justify-end border-t border-gray-100 bg-gray-50">
          <UiButton type="button" bg="white" text="raspberry" onClick={onDismiss} disabled={busy} className="w-full sm:w-auto justify-center py-3 sm:py-2">
            Annuler
          </UiButton>
          <UiButton type="button" bg="white" text="raspberry" onClick={onUseFullImage} disabled={busy} className="w-full sm:w-auto justify-center py-3 sm:py-2">
            Sans recadrage
          </UiButton>
          <UiButton
            type="button"
            bg="raspberry"
            text="white"
            onClick={handleConfirmCrop}
            disabled={busy || !completedCropPx}
            className="w-full sm:w-auto justify-center py-3 sm:py-2"
          >
            {busy ? "Export…" : "Valider le recadrage"}
          </UiButton>
        </div>
      </div>
    </div>
  );
}
