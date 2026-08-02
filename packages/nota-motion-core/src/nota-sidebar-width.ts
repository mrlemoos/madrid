import { NOTA_SIDEBAR_WIDTH_PX } from '@/lib/nota-motion';

/** Default notes sidebar width (px). */
export const NOTA_SIDEBAR_DEFAULT_WIDTH_PX = NOTA_SIDEBAR_WIDTH_PX;

/** Narrowest usable notes sidebar (px). */
export const NOTA_SIDEBAR_MIN_WIDTH_PX = 240;

/** Widest notes sidebar (px). */
export const NOTA_SIDEBAR_MAX_WIDTH_PX = 480;

export function clampNotaSidebarWidthPx(widthPx: number): number {
  if (!Number.isFinite(widthPx)) {
    return NOTA_SIDEBAR_DEFAULT_WIDTH_PX;
  }
  return Math.min(
    NOTA_SIDEBAR_MAX_WIDTH_PX,
    Math.max(NOTA_SIDEBAR_MIN_WIDTH_PX, Math.round(widthPx)),
  );
}
