import { vi } from 'vitest';

/** Zustand persist needs a full `Storage` shape; some Node runtimes lack `setItem`. */
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
