import { vi } from 'vitest';

/** jsdom lacks `window.matchMedia`; `usePrefersReducedMotion` needs it. */
function createMatchMediaStub(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  };
}

if (typeof window.matchMedia !== 'function') {
  vi.stubGlobal('matchMedia', createMatchMediaStub);
}
