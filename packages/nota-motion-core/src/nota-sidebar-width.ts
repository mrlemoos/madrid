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
 * Collapsed icon-rail width (px). Overlay only — the aside clip goes to 0 so
 * the note uses the full shell until hover reveals this rail.
 */
export const NOTA_SIDEBAR_ICON_WIDTH_PX = 48;

/** Collapsed aside clip width (px). Zero: no layout reservation. */
export const NOTA_SIDEBAR_COLLAPSED_CLIP_WIDTH_PX = 0;

/** Invisible left-edge hit target (px) that reveals the collapsed icon rail. */
export const NOTA_SIDEBAR_HOVER_EDGE_WIDTH_PX = 12;

export function clampNotaSidebarWidthPx(widthPx: number): number {
  if (!Number.isFinite(widthPx)) {
    return NOTA_SIDEBAR_DEFAULT_WIDTH_PX;
  }
  return Math.min(
    NOTA_SIDEBAR_MAX_WIDTH_PX,
    Math.max(NOTA_SIDEBAR_MIN_WIDTH_PX, Math.round(widthPx)),
  );
}
