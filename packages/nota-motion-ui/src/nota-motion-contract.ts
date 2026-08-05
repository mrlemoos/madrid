import {
  NOTA_PRESS_IN_MS,
  type NotaSpringPresetName,
} from '@nota/design/motion-tokens';

/**
 * Input path that triggered the UI change.
 * Keyboard chords (Mod+K, Mod+[ / ], history) stay silent.
 * Pointer opens may use a short ease-out or spring.
 */
export type NotaMotionInputPath = 'keyboard' | 'pointer';

/**
 * Chrome surface asking for a motion decision.
 * Palette and history stay instant on every path (high frequency).
 */
export type NotaMotionSurface =
  | 'palette'
  | 'history'
  | 'panel'
  | 'press'
  | 'shell'
  | 'popover';

export type NotaMotionKind = 'none' | 'ease-out' | 'spring';

/** DOM contract for consumers — set `data-motion` on the animated root. */
export type NotaDataMotion = 'instant' | 'animated';

export type NotaMotionDecision = {
  kind: NotaMotionKind;
  /** Timed ease duration in milliseconds; `0` for none or spring. */
  durationMs: number;
  dataMotion: NotaDataMotion;
  springPreset?: NotaSpringPresetName;
};

const INSTANT: NotaMotionDecision = {
  kind: 'none',
  durationMs: 0,
  dataMotion: 'instant',
};

/** Pointer panel swap budget — short place, never over 180ms. */
const POINTER_PANEL_MS = 180;

/**
 * Resolve whether a surface should animate for the given input path.
 *
 * Contract:
 * - keyboard path → always none / duration 0 / `data-motion="instant"`
 * - high-frequency palette & history → always instant (even on pointer)
 * - pointer panel → short ease-out
 * - pointer press → press-in ease-out
 * - pointer shell / popover → spring presets
 */
export function resolveNotaMotion(options: {
  path: NotaMotionInputPath;
  surface: NotaMotionSurface;
}): NotaMotionDecision {
  const { path, surface } = options;

  if (path === 'keyboard') {
    return INSTANT;
  }

  switch (surface) {
    case 'palette':
    case 'history':
      return INSTANT;
    case 'press':
      return {
        kind: 'ease-out',
        durationMs: NOTA_PRESS_IN_MS,
        dataMotion: 'animated',
      };
    case 'panel':
      return {
        kind: 'ease-out',
        durationMs: POINTER_PANEL_MS,
        dataMotion: 'animated',
      };
    case 'shell':
      return {
        kind: 'spring',
        durationMs: 0,
        dataMotion: 'animated',
        springPreset: 'shell',
      };
    case 'popover':
      return {
        kind: 'spring',
        durationMs: 0,
        dataMotion: 'animated',
        springPreset: 'popover',
      };
  }
}

/** Mod+K / command palette — always instant. */
export function resolvePaletteMotion(
  path: NotaMotionInputPath,
): NotaMotionDecision {
  return resolveNotaMotion({ path, surface: 'palette' });
}

/** Mod+[ / Mod+] history — always instant. */
export function resolveHistoryNavMotion(
  path: NotaMotionInputPath,
): NotaMotionDecision {
  return resolveNotaMotion({ path, surface: 'history' });
}

/** Spread onto a root element: `{ 'data-motion': 'instant' | 'animated' }`. */
export function notaMotionAttr(decision: NotaMotionDecision): {
  'data-motion': NotaDataMotion;
} {
  return { 'data-motion': decision.dataMotion };
}
