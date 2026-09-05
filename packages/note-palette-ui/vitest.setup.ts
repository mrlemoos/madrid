// Runs before Vitest tests.
import { vi } from 'vitest';
import { setClerkAccessTokenGetter } from '@getmadrid/data-source/clerk-token-ref';
import { setSupabaseClerkGetToken } from '@getmadrid/data-source/supabase/browser';

// Next App Router hooks need a router context that jsdom lacks; the palette reads
// the active screen via `usePathname` and navigates via `useRouter`.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

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

// jsdom does not implement `window.matchMedia`; ThemeProvider and nota-motion need it.
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

// TipTap `@tiptap/extension-emoji` pulls `is-emoji-supported`, which probes canvas; jsdom
// otherwise logs "Not implemented: HTMLCanvasElement.prototype.getContext".
const canvasCtor = (
  globalThis as typeof globalThis & {
    HTMLCanvasElement?: {
      prototype: { getContext: (...args: unknown[]) => unknown };
    };
  }
).HTMLCanvasElement;
if (canvasCtor) {
  canvasCtor.prototype.getContext = function () {
    return null;
  };
}

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_placeholder';

setSupabaseClerkGetToken(async () => 'test-clerk-jwt');
setClerkAccessTokenGetter(async () => 'test-clerk-jwt');
