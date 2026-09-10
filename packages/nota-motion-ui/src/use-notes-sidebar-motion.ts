import { useLayoutEffect, useRef } from 'react';
import { NOTA_SIDEBAR_REVEAL_PX } from './nota-motion';
import { NOTA_SIDEBAR_COLLAPSED_CLIP_WIDTH_PX } from '@getmadrid/nota-motion-core/sidebar-width';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

const SIDEBAR_OPEN_TRANSITION =
  'transform 280ms var(--ease-in-out), opacity 160ms var(--ease-out)';
const SIDEBAR_CLOSE_TRANSITION =
  'transform 240ms var(--ease-in-out), opacity 120ms var(--ease-out)';
const SIDEBAR_OPEN_LAYOUT_TRANSITION = 'width 280ms var(--ease-in-out)';
const SIDEBAR_CLOSE_LAYOUT_TRANSITION = 'width 240ms var(--ease-in-out)';

export type NotesSidebarMotion = {
  asideRef: React.RefObject<HTMLElement | null>;
  railRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Visibility toggles move the sidebar boundary and rail together. Initial
 * render and reduced-motion changes stay instant.
 */
export function useNotesSidebarMotion(params: {
  open: boolean;
  widthPx: number;
  mounted: boolean;
}): NotesSidebarMotion {
  const { open, widthPx, mounted } = params;
  const asideRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const motionReadyRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const aside = asideRef.current;
    const rail = railRef.current;
    if (!mounted) {
      motionReadyRef.current = false;
      return;
    }
    if (!aside || !rail) {
      return;
    }

    const layout = (isOpen: boolean, transition: string) => {
      aside.style.transition = transition;
      aside.style.width = `${String(isOpen ? widthPx : NOTA_SIDEBAR_COLLAPSED_CLIP_WIDTH_PX)}px`;
      aside.style.maxWidth = isOpen ? `${String(widthPx)}px` : 'none';
    };
    const setRail = (isOpen: boolean, transition: string) => {
      rail.style.transition = transition;
      rail.style.transform = `translateX(${String(isOpen ? 0 : -NOTA_SIDEBAR_REVEAL_PX)}px)`;
      rail.style.opacity = isOpen ? '1' : '0';
    };
    const shouldAnimate = motionReadyRef.current && !prefersReducedMotion;

    motionReadyRef.current = true;

    if (!shouldAnimate) {
      layout(open, 'none');
      setRail(open, 'none');
      return;
    }

    if (open) {
      layout(true, SIDEBAR_OPEN_LAYOUT_TRANSITION);
      setRail(false, 'none');
      // Commit the hidden pose before assigning its destination. Without this,
      // React's layout-effect writes coalesce into one paint and Chromium snaps.
      void rail.offsetWidth;
      setRail(true, SIDEBAR_OPEN_TRANSITION);
      return;
    }

    layout(false, SIDEBAR_CLOSE_LAYOUT_TRANSITION);
    setRail(true, 'none');
    void rail.offsetWidth;
    setRail(false, SIDEBAR_CLOSE_TRANSITION);
  }, [mounted, open, prefersReducedMotion, widthPx]);

  return { asideRef, railRef };
}
