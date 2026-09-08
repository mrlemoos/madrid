import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { JournalEntry } from '@getmadrid/note-journal-core/notes';

/**
 * jsdom gives the scroll element no height, so the real virtualiser renders
 * nothing. Render every row instead and keep `estimateSize` reachable, since
 * the row-height estimate is this component's own logic.
 */
const estimateSize = { current: (_index: number) => 0 };
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (options: {
    count: number;
    estimateSize: (index: number) => number;
  }) => {
    estimateSize.current = options.estimateSize;
    return {
      getTotalSize: () => options.count * 32,
      getVirtualItems: () =>
        Array.from({ length: options.count }, (_, index) => ({
          index,
          start: index * 32,
        })),
      measureElement: () => undefined,
    };
  },
}));

const { JournalNotesList } = await import('./journal-notes-list');

function entry(noteId: string, title: string, bodyPreview = ''): JournalEntry {
  return {
    noteId,
    title,
    bodyPreview,
    date: new Date(2026, 2, 4),
  } as JournalEntry;
}

describe('JournalNotesList', () => {
  it('says so for a day with nothing written', () => {
    // Arrange|Act
    render(<JournalNotesList entries={[]} onOpenNote={vi.fn()} />);

    // Assert
    expect(screen.getByText('No journal entries for this day.')).toBeTruthy();
  });

  it('shows each entry title', () => {
    // Arrange|Act
    render(
      <JournalNotesList
        entries={[
          entry('note-1', '4 March 2026'),
          entry('note-2', '3 March 2026'),
        ]}
        onOpenNote={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('4 March 2026')).toBeTruthy();
    expect(screen.getByText('3 March 2026')).toBeTruthy();
  });

  it('shows a body preview only when the note has one', () => {
    // Arrange|Act
    render(
      <JournalNotesList
        entries={[
          entry('note-1', 'With body', 'the quiet part'),
          entry('note-2', 'Title only'),
        ]}
        onOpenNote={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('the quiet part')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('leaves room for a preview line only when there is one', () => {
    // Arrange
    render(
      <JournalNotesList
        entries={[
          entry('note-1', 'With body', 'preview'),
          entry('note-2', 'Bare'),
        ]}
        onOpenNote={vi.fn()}
      />,
    );

    // Act|Assert — a wrong first guess makes the list jump as rows measure
    expect(estimateSize.current(0)).toBeGreaterThan(estimateSize.current(1));
  });

  it('opens the note behind the row that was clicked', () => {
    // Arrange
    const onOpenNote = vi.fn();
    render(
      <JournalNotesList
        entries={[entry('note-1', 'First'), entry('note-2', 'Second')]}
        onOpenNote={onOpenNote}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: /Second/ }));

    // Assert
    expect(onOpenNote).toHaveBeenCalledWith('note-2');
  });
});
