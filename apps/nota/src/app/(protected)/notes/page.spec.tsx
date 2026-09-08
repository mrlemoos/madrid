import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

const clientCreateNote = vi.fn();
const insertNoteAtFront = vi.fn();
const refreshNotesList = vi.fn();
const notes = [{ id: 'note-1' }] as Note[];
const user = { current: { id: 'user-1' } as { id: string } | null };

vi.mock('@getmadrid/notes-chrome-ui/notes-chrome-parts', () => ({
  NotesIndexPanel: ({ onCreate }: { onCreate: () => void }) => (
    <button type="button" onClick={onCreate}>
      New note
    </button>
  ),
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesData: () => ({
    notes,
    notaProEntitled: true,
    insertNoteAtFront,
    refreshNotesList,
  }),
}));
vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({ user: user.current }),
}));
vi.mock('@getmadrid/note-folders-ui/create-note-client', () => ({
  clientCreateNote,
}));

const { default: NotesListPage } = await import('./page');

beforeEach(() => {
  vi.clearAllMocks();
  user.current = { id: 'user-1' };
});

describe('NotesListPage', () => {
  it('creates a note for the signed-in reader', () => {
    // Arrange
    render(<NotesListPage />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'New note' }));

    // Assert
    expect(clientCreateNote).toHaveBeenCalledWith({
      userId: 'user-1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: true,
      notes,
    });
  });

  it('creates nothing when there is no session', () => {
    // Arrange
    user.current = null;
    render(<NotesListPage />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'New note' }));

    // Assert
    expect(clientCreateNote).not.toHaveBeenCalled();
  });
});
