import { describe, expect, it } from 'vitest';
import { NOTA_ZOOM_DEFAULT, snapNotaZoom, stepNotaZoom } from './nota-zoom';

describe('nota zoom ladder', () => {
  it('snaps arbitrary values to the nearest stop', () => {
    // Arrange
    const stored = 1.2;

    // Act
    const snapped = snapNotaZoom(stored);

    // Assert
    expect(snapped).toBe(1.25);
    expect(snapNotaZoom(Number.NaN)).toBe(NOTA_ZOOM_DEFAULT);
  });

  it('steps symmetrically and clamps at both ends', () => {
    // Arrange
    const start = NOTA_ZOOM_DEFAULT;

    // Act
    const inThenOut = stepNotaZoom(stepNotaZoom(start, 1), -1);

    // Assert
    expect(stepNotaZoom(start, 1)).toBe(1.1);
    expect(inThenOut).toBe(start);
    expect(stepNotaZoom(2, 1)).toBe(2);
    expect(stepNotaZoom(0.8, -1)).toBe(0.8);
  });
});
