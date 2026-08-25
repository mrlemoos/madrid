import { useLayoutEffect, type RefObject } from 'react';
import {
  authCardInvertTransform,
  forgetAuthCardOrigin,
  takeAuthCardOrigin,
} from '@/lib/auth-card-origin';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * FLIP the auth card from the landing "Continue with email" box.
 */
export function useAuthCardOriginMorph(
  shellRef: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }
    if (prefersReducedMotion()) {
      takeAuthCardOrigin();
      forgetAuthCardOrigin();
      return;
    }
    const origin = takeAuthCardOrigin();
    if (!origin) {
      return;
    }
    const last = shell.getBoundingClientRect();
    const invert = authCardInvertTransform(origin, last);
    if (!invert) {
      forgetAuthCardOrigin();
      return;
    }

    shell.dataset.fromOrigin = 'true';
    shell.style.transformOrigin = 'top left';
    shell.style.overflow = 'hidden';
    shell.style.borderRadius = `${origin.radius}px`;
    shell.style.transform = `translate(${invert.translateX}px, ${invert.translateY}px) scale(${invert.scaleX}, ${invert.scaleY})`;
    void shell.offsetWidth;

    let playFrame = 0;
    const invertFrame = window.requestAnimationFrame(() => {
      playFrame = window.requestAnimationFrame(() => {
        shell.dataset.originPlay = 'true';
        shell.style.transform = 'translate(0px, 0px) scale(1, 1)';
        shell.style.borderRadius = '';
      });
    });

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== shell || event.propertyName !== 'transform') {
        return;
      }
      shell.style.transform = '';
      shell.style.transformOrigin = '';
      shell.style.overflow = '';
      delete shell.dataset.fromOrigin;
      delete shell.dataset.originPlay;
      forgetAuthCardOrigin();
    };
    shell.addEventListener('transitionend', onEnd);

    return () => {
      window.cancelAnimationFrame(invertFrame);
      window.cancelAnimationFrame(playFrame);
      shell.removeEventListener('transitionend', onEnd);
    };
  }, [shellRef]);
}
