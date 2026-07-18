import {
  createCriticallyDampedSpringConfig,
  type CriticallyDampedSpringConfig,
} from '@/lib/nota-critically-damped-spring';
import { NOTA_SIDEBAR_SLIDE_PX, NOTA_SPRING_PRESETS } from '@/lib/nota-motion';

export type NotaSidebarClipLayout = {
  width: number;
  maxWidth: number | 'none';
};

export type NotaSidebarRailMotionTargets = {
  x: number;
  opacity: number;
};

/** Layout width for the notes shell sidebar clip (instant snap, not tweened). */
export function getNotaSidebarClipLayout(params: {
  open: boolean;
  widthPx: number;
}): NotaSidebarClipLayout {
  return {
    width: params.open ? params.widthPx : 0,
    maxWidth: params.open ? params.widthPx : 'none',
  };
}

/**
 * Critically damped shell spring for sidebar open/close.
 * Animate compositor `x`/`opacity` only — never layout width under load.
 */
export function getNotaSidebarShellSpringConfig(): CriticallyDampedSpringConfig {
  const shell = NOTA_SPRING_PRESETS.shell;
  return createCriticallyDampedSpringConfig(shell.response, shell.damping);
}

/** Compositor-friendly spring targets for the inner sidebar rail. */
export function getNotaSidebarRailMotionTargets(params: {
  open: boolean;
  prefersReducedMotion: boolean;
}): NotaSidebarRailMotionTargets {
  const { open, prefersReducedMotion } = params;

  return {
    opacity: open ? 1 : 0,
    x: open || prefersReducedMotion ? 0 : -NOTA_SIDEBAR_SLIDE_PX,
  };
}
