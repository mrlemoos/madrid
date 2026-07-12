import { NOTA_SIDEBAR_SLIDE_PX } from '@/lib/nota-motion';

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

/** Compositor-friendly GSAP targets for the inner sidebar rail. */
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
