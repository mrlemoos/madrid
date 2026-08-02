import { describe, expect, it } from 'vitest';
import {
  buildJournalCalendarCells,
  mondayBasedWeekday,
} from './journal-calendar';

describe('mondayBasedWeekday', () => {
  it('maps Sunday to 6 and Monday to 0', () => {
    // Arrange
    const sunday = new Date(2026, 4, 17);
    const monday = new Date(2026, 4, 18);

    // Act & Assert
    expect(mondayBasedWeekday(sunday)).toBe(6);
    expect(mondayBasedWeekday(monday)).toBe(0);
  });
});

describe('buildJournalCalendarCells', () => {
  it('returns 42 cells with May 2026 in-month days', () => {
    // Arrange
    const year = 2026;
    const month = 4;

    // Act
    const cells = buildJournalCalendarCells(year, month);

    // Assert
    expect(cells).toHaveLength(42);
    expect(
      cells.filter((c) => c.inMonth && c.dateKey.startsWith('2026-05-')).length,
    ).toBe(31);
  });
});
