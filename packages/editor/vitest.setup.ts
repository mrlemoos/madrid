import { vi } from 'vitest';

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

// Canvas stub for emoji / lowlight / mermaid-adjacent paths in jsdom.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
}

// jsdom omits scrollIntoView; mention menu uses it on highlight.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
