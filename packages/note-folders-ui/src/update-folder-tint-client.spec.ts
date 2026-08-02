import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientUpdateFolderTint } from './update-folder-tint-client';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import { updateFolder } from '@nota/data-source/models/folders';

vi.mock('@nota/data-source/supabase/browser', () => ({
  getBrowserClient: () => ({}),
}));

vi.mock('@nota/data-source/notes-offline-sync', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@nota/data-source/notes-offline-sync')
    >();
  return {
    ...actual,
    isLikelyOnline: vi.fn(),
  };
});

vi.mock('@nota/data-source/models/folders', () => ({
  updateFolder: vi.fn(),
}));

describe('clientUpdateFolderTint', () => {
  const patchFolderInList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not patch when offline', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(false);

    // Act
    await clientUpdateFolderTint({
      folderId: 'folder-1',
      nextPersistedTint: 'blue',
      previousPersistedTint: null,
      userId: 'user-1',
      notaProEntitled: true,
      patchFolderInList,
    });

    // Assert
    expect(patchFolderInList).not.toHaveBeenCalled();
    expect(updateFolder).not.toHaveBeenCalled();
  });

  it('reverts list tint when the server update fails', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(true);
    vi.mocked(updateFolder).mockRejectedValue(new Error('network'));

    // Act
    await clientUpdateFolderTint({
      folderId: 'folder-1',
      nextPersistedTint: 'blue',
      previousPersistedTint: 'green',
      userId: 'user-1',
      notaProEntitled: true,
      patchFolderInList,
    });

    // Assert
    expect(patchFolderInList).toHaveBeenNthCalledWith(1, 'folder-1', {
      tint: 'blue',
    });
    expect(patchFolderInList).toHaveBeenNthCalledWith(2, 'folder-1', {
      tint: 'green',
    });
  });

  it('normalises tint from the server row after success', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(true);
    vi.mocked(updateFolder).mockResolvedValue({
      id: 'folder-1',
      user_id: 'user-1',
      name: 'Test',
      parent_id: null,
      tint: 'blue',
      created_at: '',
      updated_at: '',
    });

    // Act
    await clientUpdateFolderTint({
      folderId: 'folder-1',
      nextPersistedTint: 'blue',
      previousPersistedTint: null,
      userId: 'user-1',
      notaProEntitled: true,
      patchFolderInList,
    });

    // Assert
    expect(patchFolderInList).toHaveBeenNthCalledWith(1, 'folder-1', {
      tint: 'blue',
    });
    expect(patchFolderInList).toHaveBeenNthCalledWith(2, 'folder-1', {
      tint: 'blue',
    });
  });
});
