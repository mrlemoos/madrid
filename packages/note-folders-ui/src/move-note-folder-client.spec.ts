import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note, UserPreferences } from '@getmadrid/database-types';

const patchNote = vi.fn();
const maybePruneEmptyFolder = vi.fn().mockResolvedValue(undefined);

vi.mock('@getmadrid/data-source/vault-runtime', () => ({
  vaultMutator: { patchNote },
}));
vi.mock('./maybe-prune-empty-folder', () => ({ maybePruneEmptyFolder }));

const { clientMoveNoteToFolder } = await import('./move-note-folder-client');

const PREFS = { auto_prune_empty_folders: true } as unknown as UserPreferences;

function options(overrides: Record<string, unknown> = {}) {
  return {
    noteId: 'note-1',
    targetFolderId: 'folder-2',
    previousFolderId: 'folder-1',
    userId: 'user-1',
    notaProEntitled: true,
    userPreferences: PREFS,
    patchNoteInList: vi.fn(),
    removeFolderFromList: vi.fn(),
    refreshNotesList: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as Parameters<typeof clientMoveNoteToFolder>[0] & {
    patchNoteInList: ReturnType<typeof vi.fn>;
    removeFolderFromList: ReturnType<typeof vi.fn>;
    refreshNotesList: ReturnType<typeof vi.fn>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  patchNote.mockResolvedValue({
    outcome: 'patched-remote',
    note: { folder_id: 'folder-2' } as Note,
  });
  maybePruneEmptyFolder.mockResolvedValue(undefined);
});

describe('clientMoveNoteToFolder', () => {
  it('does nothing without Madrid Pro or a session', async () => {
    // Arrange|Act
    await clientMoveNoteToFolder(options({ notaProEntitled: false }));
    await clientMoveNoteToFolder(options({ userId: '' }));

    // Assert
    expect(patchNote).not.toHaveBeenCalled();
  });

  it('patches the note onto the target folder', async () => {
    // Arrange
    const opts = options();

    // Act
    await clientMoveNoteToFolder(opts);

    // Assert
    expect(patchNote).toHaveBeenCalledWith('user-1', {
      noteId: 'note-1',
      fields: { folder_id: 'folder-2' },
    });
    expect(opts.patchNoteInList).toHaveBeenCalledWith('note-1', {
      folder_id: 'folder-2',
    });
  });

  it('takes the server row when the write landed remotely', async () => {
    // Arrange — the server may have resolved the folder differently
    patchNote.mockResolvedValue({
      outcome: 'patched-remote',
      note: { folder_id: 'folder-canonical' } as Note,
    });
    const opts = options();

    // Act
    await clientMoveNoteToFolder(opts);

    // Assert
    expect(opts.patchNoteInList).toHaveBeenCalledWith('note-1', {
      folder_id: 'folder-canonical',
    });
  });

  it('shows the requested folder when the move only reached the local draft', async () => {
    // Arrange
    patchNote.mockResolvedValue({ outcome: 'patched-local' });
    const opts = options();

    // Act
    await clientMoveNoteToFolder(opts);

    // Assert — the sidebar must reflect the move while offline
    expect(opts.patchNoteInList).toHaveBeenCalledWith('note-1', {
      folder_id: 'folder-2',
    });
  });

  it('moves a note back to the root', async () => {
    // Arrange
    patchNote.mockResolvedValue({ outcome: 'patched-local' });
    const opts = options({ targetFolderId: null });

    // Act
    await clientMoveNoteToFolder(opts);

    // Assert
    expect(patchNote).toHaveBeenCalledWith('user-1', {
      noteId: 'note-1',
      fields: { folder_id: null },
    });
    expect(opts.patchNoteInList).toHaveBeenCalledWith('note-1', {
      folder_id: null,
    });
  });

  it('offers the folder it left for pruning, then refreshes quietly', async () => {
    // Arrange
    const opts = options();

    // Act
    await clientMoveNoteToFolder(opts);

    // Assert
    expect(maybePruneEmptyFolder).toHaveBeenCalledWith({
      folderId: 'folder-1',
      userPreferences: PREFS,
      removeFolderFromList: opts.removeFolderFromList,
    });
    expect(opts.refreshNotesList).toHaveBeenCalledWith({ silent: true });
  });
});
