import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI zoom: a scale applied as the root font size, so every rem-based Tailwind
 * size (type, spacing, radii) grows together. Device-local, like the sidebar
 * band — not a synced preference.
 */
const NOTA_ZOOM_BASE_FONT_SIZE_PX = 16;

/** Fixed ladder, so in/out are symmetric and land on the same stops. */
export const NOTA_ZOOM_STEPS: readonly number[] = [
  0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
];

export const NOTA_ZOOM_DEFAULT = 1;

/** Nearest ladder stop; used for both persisted values and step math. */
export function snapNotaZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return NOTA_ZOOM_DEFAULT;
  }
  return NOTA_ZOOM_STEPS.reduce((best, step) =>
    Math.abs(step - zoom) < Math.abs(best - zoom) ? step : best,
  );
}

/** Move `delta` stops along the ladder from the stop nearest `zoom`. */
export function stepNotaZoom(zoom: number, delta: number): number {
  const index = NOTA_ZOOM_STEPS.indexOf(snapNotaZoom(zoom));
  const next = Math.min(
    NOTA_ZOOM_STEPS.length - 1,
    Math.max(0, index + Math.trunc(delta)),
  );
  return NOTA_ZOOM_STEPS[next];
}

function applyNotaZoomToDocument(zoom: number): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.style.fontSize =
    zoom === NOTA_ZOOM_DEFAULT
      ? ''
      : `${String(NOTA_ZOOM_BASE_FONT_SIZE_PX * zoom)}px`;
}

export interface NotaZoomState {
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const useNotaZoomStore = create<NotaZoomState>()(
  persist(
    (set, get) => {
      const commit = (zoom: number): void => {
        applyNotaZoomToDocument(zoom);
        set({ zoom });
      };
      return {
        zoom: NOTA_ZOOM_DEFAULT,
        setZoom: (zoom) => {
          commit(snapNotaZoom(zoom));
        },
        zoomIn: () => {
          commit(stepNotaZoom(get().zoom, 1));
        },
        zoomOut: () => {
          commit(stepNotaZoom(get().zoom, -1));
        },
        resetZoom: () => {
          commit(NOTA_ZOOM_DEFAULT);
        },
      };
    },
    {
      name: 'nota-zoom',
      partialize: (state) => ({ zoom: state.zoom }),
      merge: (persisted, current) => {
        const p = persisted as Partial<NotaZoomState> | undefined;
        return {
          ...current,
          zoom: snapNotaZoom(
            typeof p?.zoom === 'number' ? p.zoom : current.zoom,
          ),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyNotaZoomToDocument(state.zoom);
        }
      },
    },
  ),
);
