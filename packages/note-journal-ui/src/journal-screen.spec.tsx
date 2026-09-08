import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

const vault = { current: { notes: [] as Note[] } };

vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataVault: () => vault.current,
}));

// jsdom gives the list no height, so the real virtualiser renders no rows.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: { count: number }) => ({
    getTotalSize: () => options.count * 32,
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({
        index,
        start: index * 32,
      })),
    measureElement: () => undefined,
  }),
}));

const { JournalScreen } = await import('./journal-screen');

/** A journal note is one titled with a date. */
function dated(id: string, title: string): Note {
  return {
    id,
    title,
    content: { type: 'doc', content: [] },
  };
}

function grid() {
  return screen.getByRole('grid');
}

function dayCell(day: string) {
  return within(grid()).getByRole('gridcell', { name: new RegExp(`^${day}$`) });
}

beforeEach(() => {
  vi.setSystemTime(new Date(2026, 2, 4, 9, 0));
  vault.current = {
    notes: [dated('note-1', '4 March 2026'), dated('note-2', '12 March 2026')],
  };
});

afterEach(() => {
  vi.useRealTimers();
});

describe('JournalScreen', () => {
  it('lists every journal entry before a day is picked', () => {
    // Arrange|Act
    render(<JournalScreen onOpenNote={vi.fn()} />);

    // Assert
    expect(screen.getByText('All entries')).toBeTruthy();
    expect(screen.getByText('2 notes')).toBeTruthy();
  });

  it('narrows the list to the day that was picked', () => {
    // Arrange
    render(<JournalScreen onOpenNote={vi.fn()} />);

    // Act
    fireEvent.click(dayCell('12'));

    // Assert
    expect(screen.getByText('1 notes')).toBeTruthy();
    expect(screen.queryByText('All entries')).toBeNull();
  });

  it('opens the note behind an entry', () => {
    // Arrange
    const onOpenNote = vi.fn();
    render(<JournalScreen onOpenNote={onOpenNote} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /12 March 2026/ }));

    // Assert
    expect(onOpenNote).toHaveBeenCalledWith('note-2');
  });

  it('goes back to every entry when the day is unpicked', () => {
    // Arrange
    render(<JournalScreen onOpenNote={vi.fn()} />);
    fireEvent.click(dayCell('12'));

    // Act
    fireEvent.click(dayCell('12'));

    // Assert
    expect(screen.getByText('All entries')).toBeTruthy();
  });

  it('selects today when jumping back to it', () => {
    // Arrange
    render(<JournalScreen onOpenNote={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Go to today' }));

    // Assert — landing on the month alone would still show every entry
    expect(screen.queryByText('All entries')).toBeNull();
    expect(screen.getByText('1 notes')).toBeTruthy();
  });

  it('shows an empty vault as no entries at all', () => {
    // Arrange
    vault.current = { notes: [] };

    // Act
    render(<JournalScreen onOpenNote={vi.fn()} />);

    // Assert
    expect(screen.getByText('0 notes')).toBeTruthy();
    expect(screen.getByText('No journal entries for this day.')).toBeTruthy();
  });

  it('labels both panes for assistive tech', () => {
    // Arrange|Act
    render(<JournalScreen onOpenNote={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole('region', { name: 'Journal calendar' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('region', { name: 'Journal entries' }),
    ).toBeTruthy();
  });
});
