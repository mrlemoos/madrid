import { describe, expect, it } from 'vitest';
import {
  NOTA_EASE_OUT,
  NOTA_SPRING_SHELL,
} from '@nota/web-design/motion-tokens';
import {
  NOTA_MOTION_EASE_IN,
  NOTA_MOTION_EASE_IN_OUT,
  NOTA_MOTION_EASE_OUT,
  NOTA_PRESS_IN_MS,
  NOTA_PRESS_OUT_MS,
  NOTA_SIDEBAR_S,
  NOTA_SIDEBAR_SLIDE_PX,
  NOTA_SPRING_PRESETS,
} from './nota-motion';

// Arrange: calm motion band and non-snappy eases
// Act + Assert: exported constants document product intent
// Command palette is intentionally instant (high-frequency keyboard surface).
describe('nota-motion', () => {
  it('keeps sidebar timing within the UI cap (≤300ms)', () => {
    // Arrange + Act: sidebar chrome constant
    // Assert — mirrors P0 shell spring response
    expect(NOTA_SIDEBAR_S).toBe(NOTA_SPRING_SHELL.response);
    expect(NOTA_SIDEBAR_S).toBeGreaterThanOrEqual(0.2);
    expect(NOTA_SIDEBAR_S).toBeLessThanOrEqual(0.3);
  });

  it('uses sine eases for settled motion (no power2 snappiness)', () => {
    // Arrange / Act / Assert
    expect(NOTA_MOTION_EASE_OUT).toBe('sine.out');
    expect(NOTA_MOTION_EASE_IN).toBe('sine.in');
    expect(NOTA_MOTION_EASE_IN_OUT).toBe('sine.inOut');
  });

  it('keeps GSAP shell eases separate from CSS --ease-out tokens', () => {
    // Arrange / Act / Assert
    expect(NOTA_MOTION_EASE_OUT).toBe('sine.out');
    expect(NOTA_MOTION_EASE_OUT).not.toBe(NOTA_EASE_OUT);
  });

  it('defines a modest horizontal slide for the notes sidebar', () => {
    // Arrange / Act / Assert
    expect(NOTA_SIDEBAR_SLIDE_PX).toBeGreaterThan(0);
    expect(NOTA_SIDEBAR_SLIDE_PX).toBeLessThanOrEqual(32);
  });

  it('re-exports press asymmetry and spring presets from web-design tokens', () => {
    // Arrange / Act / Assert — app consumers import from nota-motion
    expect(NOTA_PRESS_IN_MS).toBe(100);
    expect(NOTA_PRESS_OUT_MS).toBe(160);
    expect(NOTA_SPRING_PRESETS.shell).toEqual(NOTA_SPRING_SHELL);
  });
});
