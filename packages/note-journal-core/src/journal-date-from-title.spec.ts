import { describe, expect, it } from 'vitest';
import {
  journalDateKeyFromTitle,
  parseJournalDateFromTitle,
} from './journal-date-from-title';

describe('parseJournalDateFromTitle', () => {
  it('returns null for empty or untitled titles', () => {
    // Arrange
    const cases = ['', '   ', 'Untitled Note'];

    // Act & Assert
    for (const title of cases) {
      expect(parseJournalDateFromTitle(title)).toBeNull();
    }
  });

  it('parses US numeric dates', () => {
    // Arrange
    const title = '05-20-2003';

    // Act
    const date = parseJournalDateFromTitle(title);

    // Assert
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2003);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(20);
  });

  it('parses long-form month names', () => {
    // Arrange
    const title = 'May 5 2003';

    // Act
    const date = parseJournalDateFromTitle(title);

    // Assert
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2003);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(5);
  });

  it('parses ordinal phrasing', () => {
    // Arrange
    const title = '5th of May, 2003';

    // Act
    const date = parseJournalDateFromTitle(title);

    // Assert
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2003);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(5);
  });

  it('parses British daily note titles', () => {
    // Arrange
    const title = '4 March 2026';

    // Act
    const date = parseJournalDateFromTitle(title);

    // Assert
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(4);
  });

  it('returns null when no date is present', () => {
    // Arrange
    const title = 'Weekly planning';

    // Act
    const result = parseJournalDateFromTitle(title);

    // Assert
    expect(result).toBeNull();
  });
});

describe('journalDateKeyFromTitle', () => {
  it('returns YYYY-MM-DD for parseable titles', () => {
    // Arrange
    const title = 'May 5 2003';

    // Act
    const key = journalDateKeyFromTitle(title);

    // Assert
    expect(key).toBe('2003-05-05');
  });
});
