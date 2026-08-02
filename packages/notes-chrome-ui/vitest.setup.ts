// Runs before Vitest tests.
import { vi } from 'vitest';

// Node 25+ / the test runtime can provide a `localStorage` that lacks `setItem`; Zustand
// `persist` needs a full `Storage` shape (notes preferences store).
const inMemoryLocalStorage: Record<string, string> = {};
if (
  typeof (globalThis as { localStorage?: { setItem?: unknown } }).localStorage
    ?.setItem !== 'function'
) {
  vi.stubGlobal('localStorage', {
    get length() {
      return Object.keys(inMemoryLocalStorage).length;
    },
    clear: () => {
      for (const k of Object.keys(inMemoryLocalStorage)) {
        delete inMemoryLocalStorage[k];
      }
    },
    getItem: (key: string) => inMemoryLocalStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      inMemoryLocalStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete inMemoryLocalStorage[key];
    },
    key: (i: number) => Object.keys(inMemoryLocalStorage)[i] ?? null,
  });
}

// jsdom does not implement `window.matchMedia`; `usePrefersReducedMotion` (notes sidebar shell
// motion) needs it.
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
