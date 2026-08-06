import { describe, expect, it } from 'vitest';
import { localDateKey } from './local-date-key';

describe('localDateKey', () => {
  it('formats a local date as zero-padded YYYY-MM-DD', () => {
    // Arrange
    const date = new Date(2026, 2, 4);

    // Act
    const key = localDateKey(date);

    // Assert
    expect(key).toBe('2026-03-04');
  });

  it('pads single-digit months and days', () => {
    // Arrange
    const date = new Date(2003, 4, 5);

    // Act
    const key = localDateKey(date);

    // Assert
    expect(key).toBe('2003-05-05');
  });

  it('uses local calendar parts, not UTC', () => {
    // Arrange
    const date = new Date(2026, 0, 1, 0, 30);

    // Act
    const key = localDateKey(date);

    // Assert
    expect(key).toBe(`2026-01-${String(date.getDate()).padStart(2, '0')}`);
    expect(key.startsWith('2026-01-')).toBe(true);
  });
});
