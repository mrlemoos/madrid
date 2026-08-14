/**
 * Default notes sidebar width (px). Canonical source of the 288px design token;
 * `@nota/nota-motion-ui/motion` re-exports it as `NOTA_SIDEBAR_WIDTH_PX`.
 */
export const NOTA_SIDEBAR_DEFAULT_WIDTH_PX = 288;

/** Narrowest usable notes sidebar (px). */
export const NOTA_SIDEBAR_MIN_WIDTH_PX = 240;

/** Widest notes sidebar (px). */
export const NOTA_SIDEBAR_MAX_WIDTH_PX = 480;

/**
 * Collapsed notes sidebar (px) — the icon rail keeps the toggle and footer nav
 * reachable instead of going fully off-canvas.
 */
export const NOTA_SIDEBAR_ICON_WIDTH_PX = 48;

export function clampNotaSidebarWidthPx(widthPx: number): number {
  if (!Number.isFinite(widthPx)) {
    return NOTA_SIDEBAR_DEFAULT_WIDTH_PX;
  }
  return Math.min(
    NOTA_SIDEBAR_MAX_WIDTH_PX,
    Math.max(NOTA_SIDEBAR_MIN_WIDTH_PX, Math.round(widthPx)),
  );
}
