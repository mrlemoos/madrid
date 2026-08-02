import { describe, expect, it } from 'vitest';

import {
  notaMotionAttr,
  resolveHistoryNavMotion,
  resolveNotaMotion,
  resolvePaletteMotion,
} from './nota-motion-contract';

describe('nota-motion-contract', () => {
  it('makes Mod+K / keyboard palette path instant (duration 0, data-motion instant)', () => {
    // Arrange
    const path = 'keyboard' as const;

    // Act
    const decision = resolvePaletteMotion(path);
    const attr = notaMotionAttr(decision);

    // Assert — high-frequency keyboard chords must never animate
    expect(decision.kind).toBe('none');
    expect(decision.durationMs).toBe(0);
    expect(decision.dataMotion).toBe('instant');
    expect(attr).toEqual({ 'data-motion': 'instant' });
  });

  it('makes keyboard history navigation instant (Mod+[ / Mod+])', () => {
    // Arrange
    const path = 'keyboard' as const;

    // Act
    const decision = resolveHistoryNavMotion(path);

    // Assert
    expect(decision.kind).toBe('none');
    expect(decision.durationMs).toBe(0);
    expect(decision.dataMotion).toBe('instant');
  });

  it('forces zero motion for any keyboard path regardless of surface', () => {
    // Arrange
    const surfaces = [
      'palette',
      'history',
      'panel',
      'press',
      'shell',
      'popover',
    ] as const;

    // Act + Assert
    for (const surface of surfaces) {
      const decision = resolveNotaMotion({ path: 'keyboard', surface });
      expect(decision.kind).toBe('none');
      expect(decision.durationMs).toBe(0);
      expect(decision.dataMotion).toBe('instant');
    }
  });

  it('gives pointer panel swaps a short ease-out under 300ms', () => {
    // Arrange
    const path = 'pointer' as const;

    // Act
    const decision = resolveNotaMotion({ path, surface: 'panel' });

    // Assert
    expect(decision.kind).toBe('ease-out');
    expect(decision.durationMs).toBeGreaterThan(0);
    expect(decision.durationMs).toBeLessThanOrEqual(180);
    expect(decision.dataMotion).toBe('animated');
  });

  it('gives pointer shell chrome a critically damped shell spring', () => {
    // Arrange
    const path = 'pointer' as const;

    // Act
    const decision = resolveNotaMotion({ path, surface: 'shell' });

    // Assert — springs have no fixed duration; settle emerges from params
    expect(decision.kind).toBe('spring');
    expect(decision.springPreset).toBe('shell');
    expect(decision.dataMotion).toBe('animated');
  });

  it('gives pointer popovers the popover spring preset', () => {
    // Arrange
    const path = 'pointer' as const;

    // Act
    const decision = resolveNotaMotion({ path, surface: 'popover' });

    // Assert
    expect(decision.kind).toBe('spring');
    expect(decision.springPreset).toBe('popover');
    expect(decision.dataMotion).toBe('animated');
  });

  it('gives pointer press feedback a short ease-out (press-in band)', () => {
    // Arrange
    const path = 'pointer' as const;

    // Act
    const decision = resolveNotaMotion({ path, surface: 'press' });

    // Assert
    expect(decision.kind).toBe('ease-out');
    expect(decision.durationMs).toBe(100);
    expect(decision.dataMotion).toBe('animated');
  });

  it('keeps high-frequency palette instant even on the pointer path', () => {
    // Arrange — Spotlight model: open/close never waits on motion
    const path = 'pointer' as const;

    // Act
    const decision = resolvePaletteMotion(path);

    // Assert
    expect(decision.kind).toBe('none');
    expect(decision.durationMs).toBe(0);
    expect(decision.dataMotion).toBe('instant');
  });
});
