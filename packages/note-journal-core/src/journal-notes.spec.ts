import { describe, expect, it } from 'vitest';
import {
  buildJournalEntriesFromNotes,
  hasJournalNotes,
  journalDateKeysFromEntries,
} from './journal-notes';

describe('buildJournalEntriesFromNotes', () => {
  it('includes notes with date-like titles sorted newest first', () => {
    // Arrange
    const notes = [
      {
        id: 'older',
        title: '1 January 2020',
        updated_at: '2020-01-02T00:00:00.000Z',
      },
      {
        id: 'newer',
        title: '15 April 2026',
        updated_at: '2026-04-15T12:00:00.000Z',
      },
      { id: 'skip', title: 'Ideas', updated_at: '2026-01-01T00:00:00.000Z' },
    ];

    // Act
    const entries = buildJournalEntriesFromNotes(notes);

    // Assert
    expect(entries.map((e) => e.noteId)).toEqual(['newer', 'older']);
    expect(entries[0]?.dateKey).toBe('2026-04-15');
  });

  it('keeps multiple notes on the same calendar day', () => {
    // Arrange
    const notes = [
      {
        id: 'a',
        title: 'May 5 2003',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        title: '5th of May, 2003',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
    ];

    // Act
    const entries = buildJournalEntriesFromNotes(notes);

    // Assert
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.dateKey === '2003-05-05')).toBe(true);
  });
});

describe('hasJournalNotes', () => {
  it('is true when at least one title parses as a date', () => {
    // Arrange
    const notes = [{ id: '1', title: 'May 5 2003', updated_at: '' }];

    // Act
    const result = hasJournalNotes(notes);

    // Assert
    expect(result).toBe(true);
  });

  it('is false when no titles parse', () => {
    // Arrange
    const notes = [{ id: '1', title: 'Shopping list', updated_at: '' }];

    // Act
    const result = hasJournalNotes(notes);

    // Assert
    expect(result).toBe(false);
  });
});

describe('journalDateKeysFromEntries', () => {
  it('returns unique date keys', () => {
    // Arrange
    const entries = buildJournalEntriesFromNotes([
      { id: 'a', title: 'May 5 2003', updated_at: '' },
      { id: 'b', title: '6 May 2003', updated_at: '' },
    ]);

    // Act
    const keys = journalDateKeysFromEntries(entries);

    // Assert
    expect(keys.has('2003-05-05')).toBe(true);
    expect(keys.has('2003-05-06')).toBe(true);
    expect(keys.size).toBe(2);
  });
});
