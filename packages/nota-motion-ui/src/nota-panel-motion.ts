/**
 * Intent-aware main-panel motion (Phase 4 / native-Swift UX).
 *
 * Pointer panel swaps may fade ≤180ms; keyboard / history / create-and-open stay instant.
 */

import { resolveNotaMotion } from './nota-motion-contract';

export type NavIntent = 'pointer' | 'keyboard';

export type PanelMotionMode = 'none' | 'fade';

export type PanelMotion = {
  mode: PanelMotionMode;
  durationMs: number;
  blurPx: number;
  className: string;
};

/** Max pointer panel fade — owned by `resolveNotaMotion` panel surface. */
export const NOTA_PANEL_FADE_MS = resolveNotaMotion({
  path: 'pointer',
  surface: 'panel',
}).durationMs;

/** Optional enter blur for pointer fades (≤2px). */
export const NOTA_PANEL_FADE_BLUR_PX = 2;

/** CSS class applied by ShellPanel on pointer enter. */
export const NOTA_PANEL_FADE_CLASS = 'nota-panel-enter-fade';

const NAV_INTENT_ATTR = 'data-nav-intent';

/**
 * Owns the pending nav-intent: the mutable value, its epoch-guarded
 * next-frame auto-reset, and the `data-nav-intent` DOM marker — behind a
 * small interface. A producer `mark`s intent; the consumer reads it once with
 * `consume` (which resets to the safe `keyboard` default). Environment access
 * (`requestAnimationFrame`, `document`) is injected so each instance is
 * unit-testable in isolation.
 */
export type NavIntentRegister = {
  mark(intent: NavIntent): void;
  peek(): NavIntent;
  consume(): NavIntent;
  reset(): void;
};

type NavIntentRegisterEnv = {
  requestAnimationFrame?: ((callback: () => void) => unknown) | null;
  getDocumentElement?: () => {
    setAttribute(name: string, value: string): void;
  } | null;
};

function defaultRequestAnimationFrame():
  | ((callback: () => void) => unknown)
  | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.requestAnimationFrame.bind(window);
}

function defaultGetDocumentElement(): {
  setAttribute(name: string, value: string): void;
} | null {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.documentElement;
}

export function createNavIntentRegister(
  env: NavIntentRegisterEnv = {},
): NavIntentRegister {
  const requestAnimationFrame =
    env.requestAnimationFrame === undefined
      ? defaultRequestAnimationFrame()
      : env.requestAnimationFrame;
  const getDocumentElement =
    env.getDocumentElement ?? defaultGetDocumentElement;

  let pendingNavIntent: NavIntent = 'keyboard';
  let epoch = 0;

  function syncDocument(intent: NavIntent): void {
    getDocumentElement()?.setAttribute(NAV_INTENT_ATTR, intent);
  }

  function scheduleReset(scheduledEpoch: number): void {
    if (!requestAnimationFrame) {
      return;
    }
    requestAnimationFrame(() => {
      if (scheduledEpoch !== epoch) {
        return;
      }
      pendingNavIntent = 'keyboard';
      syncDocument('keyboard');
    });
  }

  return {
    mark(intent: NavIntent): void {
      pendingNavIntent = intent;
      syncDocument(intent);
      scheduleReset(++epoch);
    },
    peek(): NavIntent {
      return pendingNavIntent;
    },
    consume(): NavIntent {
      const intent = pendingNavIntent;
      pendingNavIntent = 'keyboard';
      syncDocument('keyboard');
      return intent;
    },
    reset(): void {
      pendingNavIntent = 'keyboard';
      epoch += 1;
      syncDocument('keyboard');
    },
  };
}

/** Shared app-wide register instance (producers stamp, ShellPanel consumes). */
export const navIntentRegister = createNavIntentRegister();

/**
 * Pure: keyboard → no motion; pointer → short opacity (+ optional blur) fade.
 * Duration comes from `resolveNotaMotion` (P0 panel budget).
 */
export function resolvePanelMotion(intent: NavIntent): PanelMotion {
  const decision = resolveNotaMotion({
    path: intent,
    surface: 'panel',
  });
  if (decision.kind === 'none') {
    return {
      mode: 'none',
      durationMs: 0,
      blurPx: 0,
      className: '',
    };
  }
  return {
    mode: 'fade',
    durationMs: decision.durationMs,
    blurPx: NOTA_PANEL_FADE_BLUR_PX,
    className: NOTA_PANEL_FADE_CLASS,
  };
}

/** Stamp intent before `navigateToScreen` / `replaceScreen` / hash `<a>` clicks / history chords. */
export function markNavIntent(intent: NavIntent): void {
  navIntentRegister.mark(intent);
}

export function peekNavIntent(): NavIntent {
  return navIntentRegister.peek();
}

/** Read pending intent and reset to keyboard (safe default for the next nav). */
export function consumeNavIntent(): NavIntent {
  return navIntentRegister.consume();
}

/** Test helper — reset the shared register + DOM marker. */
export function resetNavIntent(): void {
  navIntentRegister.reset();
}
