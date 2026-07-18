/**
 * Intent-aware main-panel motion (Phase 4 / native-Swift UX).
 *
 * Pointer panel swaps may fade ≤180ms; keyboard / history / create-and-open stay instant.
 */

import { resolveNotaMotion } from '@/lib/nota-motion-contract';

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

let pendingNavIntent: NavIntent = 'keyboard';
let navIntentEpoch = 0;

function syncDocumentNavIntent(intent: NavIntent): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute(NAV_INTENT_ATTR, intent);
}

function scheduleNavIntentReset(epoch: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  const raf = window.requestAnimationFrame?.bind(window);
  if (!raf) {
    return;
  }
  raf(() => {
    if (epoch !== navIntentEpoch) {
      return;
    }
    pendingNavIntent = 'keyboard';
    syncDocumentNavIntent('keyboard');
  });
}

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

/** Stamp intent before `setAppHash` / `replaceAppHash` / hash `<a>` clicks / history chords. */
export function markNavIntent(intent: NavIntent): void {
  pendingNavIntent = intent;
  syncDocumentNavIntent(intent);
  const epoch = ++navIntentEpoch;
  scheduleNavIntentReset(epoch);
}

export function peekNavIntent(): NavIntent {
  return pendingNavIntent;
}

/** Read pending intent and reset to keyboard (safe default for the next nav). */
export function consumeNavIntent(): NavIntent {
  const intent = pendingNavIntent;
  pendingNavIntent = 'keyboard';
  syncDocumentNavIntent('keyboard');
  return intent;
}

/** Test helper — reset module + DOM marker. */
export function resetNavIntent(): void {
  pendingNavIntent = 'keyboard';
  navIntentEpoch += 1;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute(NAV_INTENT_ATTR, 'keyboard');
  }
}
