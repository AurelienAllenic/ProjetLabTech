import { useCallback, useRef, type ReactElement } from "react";
import type { MaskRegionPct } from "../lib/cropImageToBlob";

const MIN_MASK_PCT = 3;
const HANDLE_CORNER =
  "absolute z-[60] h-4 w-4 min-h-[32px] min-w-[32px] -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white bg-amber-600/95 shadow touch-none sm:h-3 sm:w-3 sm:min-h-0 sm:min-w-0";
/** Bord N/S : tirer verticalement seulement */
const EDGE_NS =
  "absolute z-[60] min-h-[44px] min-w-[44px] w-12 h-3 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize rounded-full border-2 border-white bg-amber-600/95 shadow touch-none sm:h-3 sm:w-10 sm:min-h-0 sm:min-w-0";
/** Bord E/W : tirer horizontalement seulement */
const EDGE_EW =
  "absolute z-[60] min-h-[44px] min-w-[44px] h-12 w-3 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-amber-600/95 shadow touch-none sm:h-10 sm:w-3 sm:min-h-0 sm:min-w-0";

export interface ImageBlackoutMasksOverlayProps {
  masks: MaskRegionPct[];
  onMasksChange: (next: MaskRegionPct[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  disabled: boolean;
}

function clampMask(m: MaskRegionPct): MaskRegionPct {
  let { x, y, w, h } = m;
  w = Math.max(MIN_MASK_PCT, Math.min(100, w));
  h = Math.max(MIN_MASK_PCT, Math.min(100, h));
  x = Math.min(Math.max(0, x), 100 - w);
  y = Math.min(Math.max(0, y), 100 - h);
  return { ...m, x, y, w, h };
}

type ResizeEdge = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

function clientToFrac(clientX: number, clientY: number, rect: DOMRect): { fx: number; fy: number } {
  const fx = (clientX - rect.left) / Math.max(rect.width, 1);
  const fy = (clientY - rect.top) / Math.max(rect.height, 1);
  return { fx: Math.min(Math.max(fx, 0), 1), fy: Math.min(Math.max(fy, 0), 1) };
}

function bindPointerSession(
  move: (ev: PointerEvent) => void,
): { stop: () => void } {
  const stop = (): void => {
    window.removeEventListener("pointermove", move, true);
    window.removeEventListener("pointerup", stop, true);
    window.removeEventListener("pointercancel", stop, true);
  };
  window.addEventListener("pointermove", move, { capture: true });
  window.addEventListener("pointerup", stop, { capture: true });
  window.addEventListener("pointercancel", stop, { capture: true });
  return { stop };
}

/** Calque superposé à l’image : coordonnées en % de l’image. */
export default function ImageBlackoutMasksOverlay({
  masks,
  onMasksChange,
  selectedId,
  onSelect,
  disabled,
}: ImageBlackoutMasksOverlayProps): ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const updateMask = useCallback((id: string, patch: Partial<MaskRegionPct>): void => {
    onMasksChange((prev) => prev.map((m) => (m.id === id ? clampMask({ ...m, ...patch }) : m)));
  }, [onMasksChange]);

  const beginMove = (e: React.PointerEvent, m: MaskRegionPct): void => {
    if (disabled || e.button !== 0) return;
    e.stopPropagation();
    onSelect(m.id);
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const { fx: startFx, fy: startFy } = clientToFrac(e.clientX, e.clientY, rect);
    const start = { ...m };

    const onMove = (ev: PointerEvent): void => {
      const { fx, fy } = clientToFrac(ev.clientX, ev.clientY, rect);
      const dfx = (fx - startFx) * 100;
      const dfy = (fy - startFy) * 100;
      updateMask(m.id, { x: start.x + dfx, y: start.y + dfy });
    };

    bindPointerSession(onMove);
  };

  const beginResize = (e: React.PointerEvent, m: MaskRegionPct, edge: ResizeEdge): void => {
    if (disabled || e.button !== 0) return;
    e.stopPropagation();
    onSelect(m.id);
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const { fx: startFx, fy: startFy } = clientToFrac(e.clientX, e.clientY, rect);
    const start = { ...m };

    const onMove = (ev: PointerEvent): void => {
      const { fx, fy } = clientToFrac(ev.clientX, ev.clientY, rect);
      const dfx = (fx - startFx) * 100;
      const dfy = (fy - startFy) * 100;

      switch (edge) {
        case "se":
          updateMask(m.id, { w: start.w + dfx, h: start.h + dfy });
          break;
        case "sw":
          updateMask(m.id, { x: start.x + dfx, w: start.w - dfx, h: start.h + dfy });
          break;
        case "ne":
          updateMask(m.id, { y: start.y + dfy, w: start.w + dfx, h: start.h - dfy });
          break;
        case "nw":
          updateMask(m.id, { x: start.x + dfx, y: start.y + dfy, w: start.w - dfx, h: start.h - dfy });
          break;
        case "n":
          updateMask(m.id, { y: start.y + dfy, h: start.h - dfy });
          break;
        case "s":
          updateMask(m.id, { h: start.h + dfy });
          break;
        case "e":
          updateMask(m.id, { w: start.w + dfx });
          break;
        case "w":
          updateMask(m.id, { x: start.x + dfx, w: start.w - dfx });
          break;
        default:
          break;
      }
    };

    bindPointerSession(onMove);
  };

  const peMask = disabled ? "pointer-events-none" : "pointer-events-auto";

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0" aria-hidden>
      {masks.map((m) => {
        const sel = selectedId === m.id;
        const zBody = sel ? 50 : 30;
        return (
          <div key={m.id}>
            <div
              role="presentation"
              className={[
                peMask,
                "absolute cursor-move rounded-sm touch-none bg-black/50",
                sel ? "ring-2 ring-amber-100 ring-offset-1 ring-offset-black/40" : "ring-1 ring-white/60",
              ].join(" ")}
              style={{
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: `${m.w}%`,
                height: `${m.h}%`,
                zIndex: zBody,
              }}
              onPointerDown={(e) => beginMove(e, m)}
            />
            {!disabled && sel ? (
              <>
                <button
                  type="button"
                  aria-label="Redimensionner le coin nord-ouest"
                  tabIndex={-1}
                  className={`pointer-events-auto ${HANDLE_CORNER} ord-nw`}
                  style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  onPointerDown={(e) => beginResize(e, m, "nw")}
                />
                <button
                  type="button"
                  aria-label="Redimensionner le coin nord-est"
                  tabIndex={-1}
                  className={`pointer-events-auto ${HANDLE_CORNER} ord-ne`}
                  style={{ left: `${m.x + m.w}%`, top: `${m.y}%` }}
                  onPointerDown={(e) => beginResize(e, m, "ne")}
                />
                <button
                  type="button"
                  aria-label="Redimensionner le coin sud-ouest"
                  tabIndex={-1}
                  className={`pointer-events-auto ${HANDLE_CORNER} ord-sw`}
                  style={{ left: `${m.x}%`, top: `${m.y + m.h}%` }}
                  onPointerDown={(e) => beginResize(e, m, "sw")}
                />
                <button
                  type="button"
                  aria-label="Redimensionner le coin sud-est"
                  tabIndex={-1}
                  className={`pointer-events-auto ${HANDLE_CORNER} ord-se`}
                  style={{ left: `${m.x + m.w}%`, top: `${m.y + m.h}%` }}
                  onPointerDown={(e) => beginResize(e, m, "se")}
                />
                <button
                  type="button"
                  aria-label="Étirer le bord nord (hauteur seulement)"
                  tabIndex={-1}
                  className={`pointer-events-auto ${EDGE_NS}`}
                  style={{ left: `${m.x + m.w / 2}%`, top: `${m.y}%` }}
                  onPointerDown={(e) => beginResize(e, m, "n")}
                />
                <button
                  type="button"
                  aria-label="Étirer le bord sud (hauteur seulement)"
                  tabIndex={-1}
                  className={`pointer-events-auto ${EDGE_NS}`}
                  style={{ left: `${m.x + m.w / 2}%`, top: `${m.y + m.h}%` }}
                  onPointerDown={(e) => beginResize(e, m, "s")}
                />
                <button
                  type="button"
                  aria-label="Étirer le bord est (largeur seulement)"
                  tabIndex={-1}
                  className={`pointer-events-auto ${EDGE_EW}`}
                  style={{ left: `${m.x + m.w}%`, top: `${m.y + m.h / 2}%` }}
                  onPointerDown={(e) => beginResize(e, m, "e")}
                />
                <button
                  type="button"
                  aria-label="Étirer le bord ouest (largeur seulement)"
                  tabIndex={-1}
                  className={`pointer-events-auto ${EDGE_EW}`}
                  style={{ left: `${m.x}%`, top: `${m.y + m.h / 2}%` }}
                  onPointerDown={(e) => beginResize(e, m, "w")}
                />
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
