import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/**
 * GSAP shell/palette eases — calm sine band; see nota-motion.spec.ts.
 * CSS micro-interactions use `@nota/web-design` `--ease-out` / `--ease-in-out`
 * (motion-tokens.ts / theme-chrome.css), not these GSAP strings.
 */
export const NOTA_MOTION_EASE_OUT = 'sine.out';
export const NOTA_MOTION_EASE_IN = 'sine.in';
export const NOTA_MOTION_EASE_IN_OUT = 'sine.inOut';

/** Crisp shell chrome band (AUDIT: UI ≤300ms). See plans/009. */
export const NOTA_SIDEBAR_S = 0.3;
export const NOTA_SIDEBAR_WIDTH_PX = 288;
/** Horizontal slide (px) when the notes sidebar closes :  content exits to the left. */
export const NOTA_SIDEBAR_SLIDE_PX = 20;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (): void => {
      setReduced(mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return reduced;
}

export { gsap, useGSAP };
