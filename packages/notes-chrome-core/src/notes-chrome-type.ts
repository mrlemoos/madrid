/**
 * Chrome density + optical tracking tokens for notes shell UI.
 * Values live in `apps/nota/styles.css` (`--nota-tracking-*`); classes here are the contract.
 */

/** Large titles / display type — negative tracking (optical). */
export const NOTA_TRACKING_DISPLAY_CLASS = 'nota-tracking-display';

/** Chrome labels at `text-xs` — near 0 / slight positive. */
export const NOTA_TRACKING_CHROME_XS_CLASS = 'nota-tracking-chrome-xs';

/**
 * Brand section heads: Instrument Serif + display tracking.
 * Sans chrome (Inter) elsewhere — do not use this on list rows or controls.
 */
export const NOTA_SECTION_HEAD_CLASS = `font-serif font-semibold ${NOTA_TRACKING_DISPLAY_CLASS}`;

/**
 * Compact chrome control size (Electron toolbar density; still touch-friendly on web).
 * Prefer over `size-8` / `icon-lg` for shell toggles.
 */
export const NOTA_CHROME_CONTROL_COMPACT_CLASS = 'size-7';
