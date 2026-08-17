import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  NOTA_PRESS_IN_MS,
  NOTA_PRESS_OUT_MS,
  NOTA_PRESS_SCALE,
  NOTA_SPRING_POPOVER,
  NOTA_SPRING_PRESETS,
  NOTA_SPRING_SETTLE,
  NOTA_SPRING_SHELL,
} from '@nota/design/motion-tokens';
import {
  NOTA_SIDEBAR_DEFAULT_WIDTH_PX,
  NOTA_SIDEBAR_ICON_WIDTH_PX,
} from '@nota/nota-motion-core/sidebar-width';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

gsap.registerPlugin(useGSAP);

/**
 * GSAP shell/palette eases — calm sine band; see nota-motion.spec.ts.
 * CSS micro-interactions use `@nota/design` `--ease-out` / `--ease-in-out`
 * (motion-tokens.ts / theme-chrome.css), not these GSAP strings.
 * Frequency → animate? / spring? / none? lives in `nota-motion-contract.ts`.
 */
export const NOTA_MOTION_EASE_OUT = 'sine.out';
export const NOTA_MOTION_EASE_IN = 'sine.in';
export const NOTA_MOTION_EASE_IN_OUT = 'sine.inOut';

/** Crisp shell chrome band — mirrors `NOTA_SPRING_PRESETS.shell.response`. */
export const NOTA_SIDEBAR_S = NOTA_SPRING_SHELL.response;
/** Default notes sidebar width (px) — canonical value lives in `@nota/nota-motion-core`. */
export const NOTA_SIDEBAR_WIDTH_PX = NOTA_SIDEBAR_DEFAULT_WIDTH_PX;

/** Collapsed sidebar icon-rail width (px). */
export const NOTA_SIDEBAR_RAIL_WIDTH_PX = NOTA_SIDEBAR_ICON_WIDTH_PX;
/** Left-edge hit target (px) that reveals the collapsed icon rail on hover. */
export { NOTA_SIDEBAR_HOVER_EDGE_WIDTH_PX } from '@nota/nota-motion-core/sidebar-width';
/** Horizontal slide (px) when the notes sidebar closes :  content exits to the left. */
export const NOTA_SIDEBAR_SLIDE_PX = 20;

/** Re-export press + spring tokens for app chrome consumers. */
export {
  NOTA_PRESS_IN_MS,
  NOTA_PRESS_OUT_MS,
  NOTA_PRESS_SCALE,
  NOTA_SPRING_SHELL,
  NOTA_SPRING_POPOVER,
  NOTA_SPRING_SETTLE,
  NOTA_SPRING_PRESETS,
};

export { usePrefersReducedMotion };

export { gsap, useGSAP };
