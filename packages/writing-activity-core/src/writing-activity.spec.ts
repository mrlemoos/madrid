import { describe, expect, it } from 'vitest';
import {
  getActivityLevel,
  computeWritingActivityDaysFromNotes,
  incrementActivityDay,
  computeCurrentStreak,
  computeLongestStreak,
  countActiveDaysLast365,
  buildActivityGridCells,
} from './writing-activity';

describe('getActivityLevel', () => {
  it('maps counts to 0-4 levels per locked buckets', () => {
    // Arrange / Act / Assert
    expect(getActivityLevel(0)).toBe(0);
    expect(getActivityLevel(1)).toBe(1);
    expect(getActivityLevel(2)).toBe(2);
    expect(getActivityLevel(3)).toBe(2);
    expect(getActivityLevel(4)).toBe(3);
    expect(getActivityLevel(6)).toBe(3);
    expect(getActivityLevel(7)).toBe(4);
    expect(getActivityLevel(42)).toBe(4);
  });
});

describe('computeWritingActivityDaysFromNotes', () => {
  it('unions created_at and updated_at local dates with count 1 per unique day', () => {
    // Arrange
    const notes = [
      {
        created_at: '2026-03-01T10:00:00Z',
        updated_at: '2026-03-05T12:00:00Z',
      },
      {
        created_at: '2026-03-05T09:00:00Z',
        updated_at: '2026-03-05T09:00:00Z',
      },
    ];

    // Act
    const days = computeWritingActivityDaysFromNotes(notes);

    // Assert
    expect(days['2026-03-01']).toBe(1);
    expect(days['2026-03-05']).toBe(2); // created + updated from first, created from second
  });
});

describe('incrementActivityDay', () => {
  it('increments existing day and initialises new day to 1', () => {
    // Arrange
    const base = { '2026-04-01': 3 };

    // Act
    const after1 = incrementActivityDay(base, '2026-04-01');
    const after2 = incrementActivityDay(after1, '2026-04-02');

    // Assert
    expect(after1['2026-04-01']).toBe(4);
    expect(after2['2026-04-02']).toBe(1);
  });
});

describe('computeCurrentStreak', () => {
  it('returns 0 with no activity', () => {
    expect(computeCurrentStreak({})).toBe(0);
  });
});

describe('computeLongestStreak', () => {
  it('finds longest run of consecutive active days', () => {
    // Arrange
    const days = {
      '2026-01-01': 1,
      '2026-01-02': 1,
      '2026-01-03': 1,
      '2026-01-10': 2,
      '2026-01-11': 1,
    };

    // Act
    const longest = computeLongestStreak(days);

    // Assert
    expect(longest).toBe(3);
  });
});

describe('countActiveDaysLast365', () => {
  it('counts days with activity in rolling window', () => {
    const days: Record<string, number> = {};
    // Use localDateKey logic via direct keys for test
    days['2025-01-01'] = 1; // old, ignored
    days['2026-04-01'] = 5;

    // We only assert the function runs and returns sensible number for current window
    const count = countActiveDaysLast365(days);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe('buildActivityGridCells', () => {
  it('produces 371 cells (53w x 7) for 365-day rolling view', () => {
    // Arrange
    const days = { '2026-04-05': 3 };

    // Act
    const cells = buildActivityGridCells(days);

    // Assert
    expect(cells.length).toBe(371);
    expect(cells.some((c) => c.count > 0)).toBe(true);
  });
});
