import { cn } from './utils.js';

/** Base UI popup enter/exit: scale from trigger, 200ms ease-out, no scale(0). */
export const NOTA_POPUP_MOTION_CLASS = cn(
  'origin-[var(--transform-origin)] transition-[transform,scale,opacity] duration-200 ease-out',
  'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
  'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
);
