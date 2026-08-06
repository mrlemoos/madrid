import { useEffect, useState } from 'react';

/**
 * Tracks the `prefers-reduced-motion: reduce` media query (SSR-safe).
 * Single home for the app + journal calendar; motion surfaces gate springs on it.
 */
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
