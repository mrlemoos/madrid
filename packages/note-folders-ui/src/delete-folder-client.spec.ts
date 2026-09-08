import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Folder } from '@getmadrid/database-types';

const isLikelyOnline = vi.fn(() => true);
const listFolders = vi.fn();
const moveAllNotesInFolderSubtree = vi.fn();
const listNoteIdsInFolderSubtree = vi.fn();
const deleteNote = vi.fn();
const deleteFolderById = vi.fn();
const client = { client: 'browser' };

vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient: () => client,
}));
vi.mock('@getmadrid/data-source/notes-offline-sync', () => ({
  isLikelyOnline,
}));
vi.mock('@getmadrid/data-source/models/notes', () => ({
  deleteNote,
  listNoteIdsInFolderSubtree,
  moveAllNotesInFolderSubtree,
}));
vi.mock('@getmadrid/data-source/models/folders', () => ({
  deleteFolderById,
  listFolders,
}));

const {
  clientDeleteAllNotesInFolderThenDeleteFolder,
  clientMoveAllNotesThenDeleteFolder,
} = await import('./delete-folder-client');

const FOLDERS = [
  { id: 'root', parent_id: null },
  { id: 'child', parent_id: 'root' },
] as Folder[];

beforeEach(() => {
  vi.clearAllMocks();
  isLikelyOnline.mockReturnValue(true);
  listFolders.mockResolvedValue(FOLDERS);
  listNoteIdsInFolderSubtree.mockResolvedValue(['note-1', 'note-2']);
});

describe('clientMoveAllNotesThenDeleteFolder', () => {
  function options() {
    return {
      folderId: 'root',
      targetFolderId: null,
      removeFolderFromList: vi.fn(),
      refreshNotesList: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('refuses to run offline, where the move cannot be replayed', async () => {
    // Arrange
    isLikelyOnline.mockReturnValue(false);

    // Act|Assert
    await expect(clientMoveAllNotesThenDeleteFolder(options())).rejects.toThrow(
      'Moving folders requires an internet connection.',
    );
    expect(deleteFolderById).not.toHaveBeenCalled();
  });

  it('moves the notes out before deleting the folder', async () => {
    // Arrange
    const opts = options();

    // Act
    await clientMoveAllNotesThenDeleteFolder(opts);

    // Assert — deleting first would cascade the notes away
    expect(moveAllNotesInFolderSubtree).toHaveBeenCalledWith(
      client,
      'root',
      null,
      FOLDERS,
    );
    const moveOrder = moveAllNotesInFolderSubtree.mock.invocationCallOrder[0];
    expect(deleteFolderById.mock.invocationCallOrder[0]).toBeGreaterThan(
      moveOrder,
    );
  });

  it('drops the whole subtree from the sidebar, not just the folder deleted', async () => {
    // Arrange
    const opts = options();

    // Act
    await clientMoveAllNotesThenDeleteFolder(opts);

    // Assert
    expect(opts.removeFolderFromList.mock.calls.flat()).toEqual([
      'root',
      'child',
    ]);
  });

  it('refreshes the vault quietly at the end', async () => {
    // Arrange
    const opts = options();

    // Act
    await clientMoveAllNotesThenDeleteFolder(opts);

    // Assert
    expect(opts.refreshNotesList).toHaveBeenCalledWith({ silent: true });
  });
});

describe('clientDeleteAllNotesInFolderThenDeleteFolder', () => {
  function options() {
    return {
      folderId: 'root',
      removeNoteFromList: vi.fn(),
      removeFolderFromList: vi.fn(),
      refreshNotesList: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('refuses to run offline', async () => {
    // Arrange
    isLikelyOnline.mockReturnValue(false);

    // Act|Assert
    await expect(
      clientDeleteAllNotesInFolderThenDeleteFolder(options()),
    ).rejects.toThrow('Deleting a folder requires an internet connection.');
    expect(deleteNote).not.toHaveBeenCalled();
  });

  it('deletes every note in the subtree, then the folders', async () => {
    // Arrange
    const opts = options();

    // Act
    await clientDeleteAllNotesInFolderThenDeleteFolder(opts);

    // Assert
    expect(deleteNote.mock.calls).toEqual([
      [client, 'note-1'],
      [client, 'note-2'],
    ]);
    expect(opts.removeNoteFromList.mock.calls.flat()).toEqual([
      'note-1',
      'note-2',
    ]);
    expect(opts.removeFolderFromList.mock.calls.flat()).toEqual([
      'root',
      'child',
    ]);
  });

  it('deletes the notes before the folder row', async () => {
    // Arrange|Act
    await clientDeleteAllNotesInFolderThenDeleteFolder(options());

    // Assert
    expect(deleteFolderById.mock.invocationCallOrder[0]).toBeGreaterThan(
      deleteNote.mock.invocationCallOrder.at(-1) as number,
    );
  });

  it('still deletes the folder when it holds no notes', async () => {
    // Arrange
    listNoteIdsInFolderSubtree.mockResolvedValue([]);
    const opts = options();

    // Act
    await clientDeleteAllNotesInFolderThenDeleteFolder(opts);

    // Assert
    expect(deleteNote).not.toHaveBeenCalled();
    expect(deleteFolderById).toHaveBeenCalledWith(client, 'root');
  });
});
