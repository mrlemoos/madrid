import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Folder } from '@getmadrid/database-types';

const clientMoveAllNotesThenDeleteFolder = vi.fn();
const clientDeleteAllNotesInFolderThenDeleteFolder = vi.fn();

vi.mock('./delete-folder-client', () => ({
  clientMoveAllNotesThenDeleteFolder,
  clientDeleteAllNotesInFolderThenDeleteFolder,
}));

const { FolderDeleteDialog } = await import('./folder-delete-dialog');

function folder(id: string, name: string, parent_id: string | null): Folder {
  return { id, name, parent_id } as Folder;
}

const ALL = [
  folder('root', 'Root', null),
  folder('child', 'Child', 'root'),
  folder('other', 'Other', null),
];

function props(overrides: Record<string, unknown> = {}) {
  return {
    folder: ALL[0],
    allFolders: ALL,
    open: true,
    onOpenChange: vi.fn(),
    removeNoteFromList: vi.fn(),
    removeFolderFromList: vi.fn(),
    refreshNotesList: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Parameters<typeof FolderDeleteDialog>[0] & {
    onOpenChange: ReturnType<typeof vi.fn>;
    removeNoteFromList: ReturnType<typeof vi.fn>;
    removeFolderFromList: ReturnType<typeof vi.fn>;
    refreshNotesList: ReturnType<typeof vi.fn>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  clientMoveAllNotesThenDeleteFolder.mockResolvedValue(undefined);
  clientDeleteAllNotesInFolderThenDeleteFolder.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FolderDeleteDialog', () => {
  it('names the folder it is about to delete', () => {
    // Arrange|Act
    render(<FolderDeleteDialog {...props()} />);

    // Assert
    expect(screen.getByText('Delete folder "Root"?')).toBeTruthy();
  });

  it('falls back to a generic title with no folder', () => {
    // Arrange|Act
    render(<FolderDeleteDialog {...props({ folder: null })} />);

    // Assert
    expect(screen.getByText('Delete folder?')).toBeTruthy();
  });

  it('never offers the folder or its descendants as a move target', () => {
    // Arrange|Act
    render(<FolderDeleteDialog {...props()} />);

    // Assert — moving notes into a folder about to be deleted would lose them
    const options = [
      ...screen.getByRole('combobox').querySelectorAll('option'),
    ];
    expect(options.map((o) => o.getAttribute('value'))).toEqual(['', 'other']);
  });

  it('moves notes to the root when no target is chosen', async () => {
    // Arrange
    const p = props();
    render(<FolderDeleteDialog {...p} />);

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: 'Move notes and delete folder' }),
    );

    // Assert
    await waitFor(() => {
      expect(clientMoveAllNotesThenDeleteFolder).toHaveBeenCalledWith(
        expect.objectContaining({ folderId: 'root', targetFolderId: null }),
      );
    });
    expect(p.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('moves notes to the chosen folder', async () => {
    // Arrange
    render(<FolderDeleteDialog {...props()} />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'other' },
    });

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: 'Move notes and delete folder' }),
    );

    // Assert
    await waitFor(() => {
      expect(clientMoveAllNotesThenDeleteFolder).toHaveBeenCalledWith(
        expect.objectContaining({ targetFolderId: 'other' }),
      );
    });
  });

  it('asks before deleting every note, and stops if the answer is no', () => {
    // Arrange
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    render(<FolderDeleteDialog {...props()} />);

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete all notes in folder' }),
    );

    // Assert
    expect(clientDeleteAllNotesInFolderThenDeleteFolder).not.toHaveBeenCalled();
  });

  it('deletes every note once confirmed', async () => {
    // Arrange
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    const p = props();
    render(<FolderDeleteDialog {...p} />);

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete all notes in folder' }),
    );

    // Assert
    await waitFor(() => {
      expect(clientDeleteAllNotesInFolderThenDeleteFolder).toHaveBeenCalledWith(
        expect.objectContaining({ folderId: 'root' }),
      );
    });
    expect(p.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows why the move failed and keeps the dialog open', async () => {
    // Arrange
    clientMoveAllNotesThenDeleteFolder.mockRejectedValue(
      new Error('Moving folders requires an internet connection.'),
    );
    const p = props();
    render(<FolderDeleteDialog {...p} />);

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: 'Move notes and delete folder' }),
    );

    // Assert
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Moving folders requires an internet connection.',
    );
    expect(p.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('does nothing when there is no folder to delete', () => {
    // Arrange
    render(<FolderDeleteDialog {...props({ folder: null })} />);

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: 'Move notes and delete folder' }),
    );

    // Assert
    expect(clientMoveAllNotesThenDeleteFolder).not.toHaveBeenCalled();
  });

  it('closes without touching anything on Cancel', () => {
    // Arrange
    const p = props();
    render(<FolderDeleteDialog {...p} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(p.onOpenChange).toHaveBeenCalledWith(false);
    expect(clientMoveAllNotesThenDeleteFolder).not.toHaveBeenCalled();
    expect(clientDeleteAllNotesInFolderThenDeleteFolder).not.toHaveBeenCalled();
  });
});
