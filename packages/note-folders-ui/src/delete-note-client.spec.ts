import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientDeleteNoteById } from './delete-note-client';
import { vaultMutator } from '@getmadrid/data-source/vault-runtime';

const removeNoteFromList = vi.fn();
const removeFolderFromList = vi.fn();
const refreshNotesList = vi.fn();

vi.mock('@getmadrid/data-source/vault-runtime', () => ({
  vaultMutator: {
    deleteNote: vi.fn(),
  },
}));

vi.mock('@getmadrid/app-navigation-core/navigation', () => ({
  navigateToScreen: vi.fn(),
}));

vi.mock('./maybe-prune-empty-folder', () => ({
  maybePruneEmptyFolder: vi.fn(() => Promise.resolve()),
}));

describe('clientDeleteNoteById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when not entitled', async () => {
    // Arrange
    const noteId = 'n1';
    const args = {
      userId: 'u1',
      removeNoteFromList,
      removeFolderFromList,
      refreshNotesList,
      notaProEntitled: false,
      noteFolderId: null,
      userPreferences: null,
    };

    // Act
    await clientDeleteNoteById(noteId, args);

    // Assert
    expect(vaultMutator.deleteNote).not.toHaveBeenCalled();
    expect(removeNoteFromList).not.toHaveBeenCalled();
  });

  it('removes the note locally when the mutation is queued offline', async () => {
    // Arrange
    vi.mocked(vaultMutator.deleteNote).mockResolvedValue({
      outcome: 'queued-local-delete',
    });
    const noteId = 'n1';
    const args = {
      userId: 'u1',
      removeNoteFromList,
      removeFolderFromList,
      refreshNotesList,
      notaProEntitled: true,
      noteFolderId: null,
      userPreferences: null,
    };

    // Act
    await clientDeleteNoteById(noteId, args);

    // Assert
    expect(vaultMutator.deleteNote).toHaveBeenCalledWith('u1', 'n1');
    expect(removeNoteFromList).toHaveBeenCalledWith('n1');
    expect(refreshNotesList).not.toHaveBeenCalled();
  });

  it('refreshes the vault list after a remote delete', async () => {
    // Arrange
    vi.mocked(vaultMutator.deleteNote).mockResolvedValue({
      outcome: 'deleted-remote',
    });
    const noteId = 'n1';
    const args = {
      userId: 'u1',
      removeNoteFromList,
      removeFolderFromList,
      refreshNotesList,
      notaProEntitled: true,
      noteFolderId: null,
      userPreferences: null,
    };

    // Act
    await clientDeleteNoteById(noteId, args);

    // Assert
    expect(vaultMutator.deleteNote).toHaveBeenCalledWith('u1', 'n1');
    expect(removeNoteFromList).toHaveBeenCalledWith('n1');
    expect(refreshNotesList).toHaveBeenCalledWith({ silent: true });
  });
});
