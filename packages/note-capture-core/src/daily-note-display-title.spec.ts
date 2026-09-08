import { describe, expect, it } from 'vitest';

import { dailyNoteDisplayTitle } from './daily-note-display-title';

describe('dailyNoteDisplayTitle', () => {
  it('formats the date as a long British calendar date', () => {
    // Arrange
    const at = new Date(2026, 2, 4, 13, 45);

    // Act
    const title = dailyNoteDisplayTitle(at);

    // Assert
    expect(title).toBe('4 March 2026');
  });

  it('reads the local calendar day, not UTC', () => {
    // Arrange — 23:30 local on New Year's Eve is already the next day in UTC+
    const at = new Date(2025, 11, 31, 23, 30);

    // Act|Assert
    expect(dailyNoteDisplayTitle(at)).toBe('31 December 2025');
  });

  it('leaves single-digit days unpadded', () => {
    // Arrange|Act|Assert
    expect(dailyNoteDisplayTitle(new Date(2026, 0, 1))).toBe('1 January 2026');
  });
});
