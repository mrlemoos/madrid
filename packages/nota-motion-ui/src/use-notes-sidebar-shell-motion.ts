import { useLayoutEffect, useRef } from 'react';
import {
  gsap,
  NOTA_SIDEBAR_SLIDE_PX,
  NOTA_SPRING_PRESETS,
  useGSAP,
} from './nota-motion';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';
import {
  animateSprings,
  createCriticallyDampedSpringConfig,
  type CriticallyDampedSpringConfig,
  type SpringAnimationHandle,
} from '@nota/nota-motion-core/critically-damped-spring';

type NotaSidebarClipLayout = {
  width: number;
  maxWidth: number | 'none';
};

type NotaSidebarRailMotionTargets = {
  x: number;
  opacity: number;
};

/** Layout width for the notes shell sidebar clip (instant snap, not tweened). */
function clipLayout(open: boolean, widthPx: number): NotaSidebarClipLayout {
  return {
    width: open ? widthPx : 0,
    maxWidth: open ? widthPx : 'none',
  };
}

/** Compositor-friendly spring targets for the inner sidebar rail. */
function railTargets(
  open: boolean,
  prefersReducedMotion: boolean,
): NotaSidebarRailMotionTargets {
  return {
    opacity: open ? 1 : 0,
    x: open || prefersReducedMotion ? 0 : -NOTA_SIDEBAR_SLIDE_PX,
  };
}

/**
 * Critically damped shell spring for sidebar open/close.
 * Animate compositor `x`/`opacity` only — never layout width under load.
 */
function shellSpringConfig(): CriticallyDampedSpringConfig {
  const shell = NOTA_SPRING_PRESETS.shell;
  return createCriticallyDampedSpringConfig(shell.response, shell.damping);
}

export type NotesSidebarShellMotion = {
  asideRef: React.RefObject<HTMLElement | null>;
  railRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Owns the notes shell sidebar open/close motion end to end: the clip-width
 * snap, the inner rail spring (interruptible, carrying live position and
 * velocity across a mid-flight toggle), the reduced-motion instant path, and
 * teardown when the sidebar chrome unmounts. Callers attach the returned refs
 * to the `<aside>` clip and its inner rail.
 */
export function useNotesSidebarShellMotion(params: {
  open: boolean;
  widthPx: number;
  mounted: boolean;
}): NotesSidebarShellMotion {
  const { open, widthPx, mounted } = params;

  const asideRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const widthPxRef = useRef(widthPx);
  widthPxRef.current = widthPx;
  const prefersReducedMotion = usePrefersReducedMotion();
  const motionReadyRef = useRef(false);
  const springRef = useRef<SpringAnimationHandle | null>(null);
  const springVelocityRef = useRef({ x: 0, opacity: 0 });

  useLayoutEffect(() => {
    if (!mounted) {
      motionReadyRef.current = false;
      springRef.current?.stop();
      springRef.current = null;
      springVelocityRef.current = { x: 0, opacity: 0 };
    }
  }, [mounted]);

  useLayoutEffect(() => {
    const clip = asideRef.current;
    if (!clip || !mounted || !open) {
      return;
    }
    gsap.set(clip, clipLayout(true, widthPx));
  }, [mounted, widthPx]);

  useGSAP(
    () => {
      const clip = asideRef.current;
      const rail = railRef.current;
      if (!clip || !rail) {
        return;
      }

      const layout = clipLayout(open, widthPxRef.current);
      const targets = railTargets(open, prefersReducedMotion);

      if (prefersReducedMotion || !motionReadyRef.current) {
        springRef.current?.stop();
        springRef.current = null;
        springVelocityRef.current = { x: 0, opacity: 0 };
        motionReadyRef.current = true;
        gsap.set(clip, layout);
        gsap.set(rail, targets);
        return;
      }

      const liveX = Number(gsap.getProperty(rail, 'x'));
      const liveOpacity = Number(gsap.getProperty(rail, 'opacity'));
      const fromX = Number.isFinite(liveX) ? liveX : targets.x;
      const fromOpacity = Number.isFinite(liveOpacity)
        ? liveOpacity
        : targets.opacity;

      const previous = springRef.current;
      const velocityX =
        previous?.getVelocity('x') ?? springVelocityRef.current.x;
      const velocityOpacity =
        previous?.getVelocity('opacity') ?? springVelocityRef.current.opacity;
      previous?.stop();
      springRef.current = null;

      if (open) {
        gsap.set(clip, layout);
      }

      springRef.current = animateSprings({
        from: {
          x: { value: fromX, velocity: velocityX },
          opacity: { value: fromOpacity, velocity: velocityOpacity },
        },
        to: {
          x: targets.x,
          opacity: targets.opacity,
        },
        config: shellSpringConfig(),
        onUpdate: (values) => {
          gsap.set(rail, { x: values.x, opacity: values.opacity });
          springVelocityRef.current = {
            x: springRef.current?.getVelocity('x') ?? 0,
            opacity: springRef.current?.getVelocity('opacity') ?? 0,
          };
        },
        onComplete: () => {
          springRef.current = null;
          springVelocityRef.current = { x: 0, opacity: 0 };
          if (!open) {
            gsap.set(clip, clipLayout(false, widthPxRef.current));
          }
        },
      });

      return () => {
        springRef.current?.stop();
        springRef.current = null;
      };
    },
    { dependencies: [open, prefersReducedMotion, mounted] },
  );

  return { asideRef, railRef };
}
