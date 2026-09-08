import { describe, expect, it } from 'vitest';

import { DEFAULT_STROKE_WIDTH, scaledStrokeWidth } from './types.js';

describe('scaledStrokeWidth', () => {
  it('leaves the stroke untouched on a 24 viewBox', () => {
    // Arrange|Act|Assert
    expect(scaledStrokeWidth(DEFAULT_STROKE_WIDTH, 24)).toBe(
      DEFAULT_STROKE_WIDTH,
    );
  });

  it('scales the stroke so it reads the same weight on a larger viewBox', () => {
    // Arrange|Act|Assert — a 48 viewBox drawn at 24px halves the apparent stroke
    expect(scaledStrokeWidth(2, 48)).toBe(4);
    expect(scaledStrokeWidth(1.5, 32)).toBe(2);
  });

  it('thins the stroke on a viewBox smaller than 24', () => {
    // Arrange|Act|Assert
    expect(scaledStrokeWidth(2, 12)).toBe(1);
  });
});
