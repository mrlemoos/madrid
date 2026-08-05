/** Canonical easing strings — keep in sync with theme-chrome.css */
export const NOTA_EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
export const NOTA_EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';

/**
 * Asymmetric press feedback (ms).
 * Press-in is deliberate and short; release eases out a touch longer.
 * Keep in sync with theme-chrome.css `--nota-press-in-ms` / `--nota-press-out-ms`.
 */
export const NOTA_PRESS_IN_MS = 100;
export const NOTA_PRESS_OUT_MS = 160;
/** Active scale for pressable chrome — keep in sync with `--nota-press-scale`. */
export const NOTA_PRESS_SCALE = 0.97;

/**
 * Apple-style spring presets: damping ratio + response (seconds).
 * Damping `1` = critically damped (no overshoot). Below `1` = slight bounce.
 * Response is not a fixed duration — settle time emerges from the parameters.
 */
export type SpringPreset = {
  readonly damping: number;
  readonly response: number;
};

/** Critically damped shell chrome (sidebar rail). */
export const NOTA_SPRING_SHELL = {
  damping: 1,
  response: 0.3,
} as const satisfies SpringPreset;

/** Critically damped popover / menu enter. */
export const NOTA_SPRING_POPOVER = {
  damping: 1,
  response: 0.2,
} as const satisfies SpringPreset;

/** Slightly under-damped settle after a momentum gesture (e.g. resize fling). */
export const NOTA_SPRING_SETTLE = {
  damping: 0.8,
  response: 0.3,
} as const satisfies SpringPreset;

export const NOTA_SPRING_PRESETS = {
  shell: NOTA_SPRING_SHELL,
  popover: NOTA_SPRING_POPOVER,
  settle: NOTA_SPRING_SETTLE,
} as const;

export type SpringPresetName = keyof typeof NOTA_SPRING_PRESETS;
