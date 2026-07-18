import { describe, expect, it } from 'vitest';

import {
  NOTA_EASE_IN_OUT,
  NOTA_EASE_OUT,
  NOTA_PRESS_IN_MS,
  NOTA_PRESS_OUT_MS,
  NOTA_PRESS_SCALE,
  NOTA_SPRING_POPOVER,
  NOTA_SPRING_PRESETS,
  NOTA_SPRING_SETTLE,
  NOTA_SPRING_SHELL,
} from './motion-tokens.js';

describe('motion-tokens', () => {
  it('exports canonical strong ease-out for press and hover micro-interactions', () => {
    // Arrange / Act / Assert
    expect(NOTA_EASE_OUT).toBe('cubic-bezier(0.23, 1, 0.32, 1)');
  });

  it('exports canonical ease-in-out for on-screen movement', () => {
    // Arrange / Act / Assert
    expect(NOTA_EASE_IN_OUT).toBe('cubic-bezier(0.77, 0, 0.175, 1)');
  });

  it('exports asymmetric press-in shorter than press-out', () => {
    // Arrange / Act / Assert — deliberate press snaps in; release eases out
    expect(NOTA_PRESS_IN_MS).toBe(100);
    expect(NOTA_PRESS_OUT_MS).toBe(160);
    expect(NOTA_PRESS_IN_MS).toBeLessThan(NOTA_PRESS_OUT_MS);
    expect(NOTA_PRESS_SCALE).toBe(0.97);
  });

  it('exports critically damped shell and popover spring presets', () => {
    // Arrange / Act / Assert — Apple damping 1.0 = no overshoot
    expect(NOTA_SPRING_SHELL).toEqual({ damping: 1, response: 0.3 });
    expect(NOTA_SPRING_POPOVER).toEqual({ damping: 1, response: 0.2 });
  });

  it('exports under-damped settle spring for momentum release', () => {
    // Arrange / Act / Assert — slight bounce only after a flick/drag
    expect(NOTA_SPRING_SETTLE).toEqual({ damping: 0.8, response: 0.3 });
  });

  it('exposes spring presets by name for shell, popover, and settle', () => {
    // Arrange / Act / Assert
    expect(NOTA_SPRING_PRESETS.shell).toBe(NOTA_SPRING_SHELL);
    expect(NOTA_SPRING_PRESETS.popover).toBe(NOTA_SPRING_POPOVER);
    expect(NOTA_SPRING_PRESETS.settle).toBe(NOTA_SPRING_SETTLE);
  });
});
