import { describe, expect, it } from 'vitest';
import { rubberband, rubberbandBeyondClamp } from './nota-rubberband';

describe('rubberband', () => {
  it('applies the Apple progressive-resistance formula', () => {
    // Arrange
    const overshoot = 100;
    const dimension = 240;
    const constant = 0.55;
    const expected =
      (overshoot * dimension * constant) /
      (dimension + constant * Math.abs(overshoot));

    // Act
    const resisted = rubberband(overshoot, dimension, constant);

    // Assert
    expect(resisted).toBeCloseTo(expected, 10);
    expect(resisted).toBeCloseTo(44.7457627119, 6);
  });

  it('returns zero when there is no overshoot', () => {
    // Arrange
    const overshoot = 0;
    const dimension = 288;

    // Act
    const resisted = rubberband(overshoot, dimension);

    // Assert
    expect(resisted).toBe(0);
  });

  it('diminishes large overshoots relative to free travel', () => {
    // Arrange
    const overshoot = 1000;
    const dimension = 240;

    // Act
    const resisted = rubberband(overshoot, dimension);

    // Assert
    expect(resisted).toBeLessThan(overshoot);
    expect(resisted).toBeGreaterThan(0);
  });
});

describe('rubberbandBeyondClamp', () => {
  it('passes through values inside the clamp band', () => {
    // Arrange
    const value = 320;
    const min = 240;
    const max = 480;
    const dimension = 240;

    // Act
    const next = rubberbandBeyondClamp(value, min, max, dimension);

    // Assert
    expect(next).toBe(320);
  });

  it('softens travel past the maximum', () => {
    // Arrange
    const value = 580;
    const min = 240;
    const max = 480;
    const dimension = 240;
    const overshoot = value - max;

    // Act
    const next = rubberbandBeyondClamp(value, min, max, dimension);

    // Assert
    expect(next).toBeGreaterThan(max);
    expect(next).toBeLessThan(value);
    expect(next).toBeCloseTo(max + rubberband(overshoot, dimension), 10);
  });

  it('softens travel past the minimum', () => {
    // Arrange
    const value = 180;
    const min = 240;
    const max = 480;
    const dimension = 240;
    const overshoot = min - value;

    // Act
    const next = rubberbandBeyondClamp(value, min, max, dimension);

    // Assert
    expect(next).toBeLessThan(min);
    expect(next).toBeGreaterThan(value);
    expect(next).toBeCloseTo(min - rubberband(overshoot, dimension), 10);
  });
});
