import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientRenameFolder } from './rename-folder-client';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import { updateFolder } from '@nota/data-source/models/folders';

const patchFolderInList = vi.fn();

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
  updateFolder: vi.fn(() =>
    Promise.resolve({
      id: 'folder-1',
      user_id: 'user-1',
      name: 'Server Name',
      parent_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }),
  ),
}));

describe('clientRenameFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patches locally and skips server update while offline', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(false);

    // Act
    await clientRenameFolder({
      folderId: 'folder-1',
      previousName: 'Old Name',
      nextName: 'New Name',
      userId: 'user-1',
      notaProEntitled: true,
      patchFolderInList,
    });

    // Assert
    expect(patchFolderInList).toHaveBeenCalledWith('folder-1', {
      name: 'New Name',
    });
    expect(updateFolder).not.toHaveBeenCalled();
  });

  it('patches locally before syncing server update when online', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(true);

    // Act
    await clientRenameFolder({
      folderId: 'folder-1',
      previousName: 'Old Name',
      nextName: 'New Name',
      userId: 'user-1',
      notaProEntitled: true,
      patchFolderInList,
    });

    // Assert
    expect(patchFolderInList).toHaveBeenNthCalledWith(1, 'folder-1', {
      name: 'New Name',
    });
    expect(updateFolder).toHaveBeenCalledTimes(1);
    expect(patchFolderInList).toHaveBeenNthCalledWith(2, 'folder-1', {
      name: 'Server Name',
    });
  });
});
