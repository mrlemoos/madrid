import { cn } from './utils.js';

/** Base UI popup enter/exit: scale from trigger, 200ms ease-out, no scale(0). */
export const NOTA_POPUP_MOTION_CLASS = cn(
  'origin-[var(--transform-origin)] transition-[transform,opacity] duration-200 ease-out',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
);

/**
 * Lighter popup motion for tooltips (150ms, same origin + scale-95 contract).
 */
export const NOTA_TOOLTIP_MOTION_CLASS = cn(
  'origin-[var(--transform-origin)] transition-[transform,opacity] duration-150 ease-out',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
);

/**
 * Pointer-open dialog enter/exit from centre (keyboard surfaces stay instant).
 */
export const NOTA_DIALOG_MOTION_CLASS = cn(
  'origin-center transition-[transform,opacity] duration-150 ease-out',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
);
