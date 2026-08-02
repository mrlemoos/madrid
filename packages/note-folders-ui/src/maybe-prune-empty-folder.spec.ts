import { beforeEach, describe, expect, it, vi } from 'vitest';
import { maybePruneEmptyFolder } from './maybe-prune-empty-folder';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import {
  countNotesInFolder,
  deleteFolderById,
  folderHasChildFolders,
} from '@nota/data-source/models/folders';
import type { UserPreferences } from '@nota/database-types';

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
  folderHasChildFolders: vi.fn(),
  countNotesInFolder: vi.fn(),
  deleteFolderById: vi.fn(),
}));

const prefsOn = {
  delete_empty_folders: true,
} as UserPreferences;

describe('maybePruneEmptyFolder', () => {
  const removeFolderFromList = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isLikelyOnline).mockReturnValue(true);
  });

  it('no-ops when folderId is missing', async () => {
    // Act
    await maybePruneEmptyFolder({
      folderId: null,
      userPreferences: prefsOn,
      removeFolderFromList,
    });

    // Assert
    expect(folderHasChildFolders).not.toHaveBeenCalled();
    expect(removeFolderFromList).not.toHaveBeenCalled();
  });

  it('no-ops when delete_empty_folders preference is off', async () => {
    // Act
    await maybePruneEmptyFolder({
      folderId: 'folder-1',
      userPreferences: { delete_empty_folders: false } as UserPreferences,
      removeFolderFromList,
    });

    // Assert
    expect(folderHasChildFolders).not.toHaveBeenCalled();
  });

  it('no-ops while offline', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(false);

    // Act
    await maybePruneEmptyFolder({
      folderId: 'folder-1',
      userPreferences: prefsOn,
      removeFolderFromList,
    });

    // Assert
    expect(folderHasChildFolders).not.toHaveBeenCalled();
  });

  it('keeps folder when it still has child folders', async () => {
    // Arrange
    vi.mocked(folderHasChildFolders).mockResolvedValue(true);

    // Act
    await maybePruneEmptyFolder({
      folderId: 'folder-1',
      userPreferences: prefsOn,
      removeFolderFromList,
    });

    // Assert
    expect(countNotesInFolder).not.toHaveBeenCalled();
    expect(deleteFolderById).not.toHaveBeenCalled();
  });

  it('keeps folder when notes remain', async () => {
    // Arrange
    vi.mocked(folderHasChildFolders).mockResolvedValue(false);
    vi.mocked(countNotesInFolder).mockResolvedValue(2);

    // Act
    await maybePruneEmptyFolder({
      folderId: 'folder-1',
      userPreferences: prefsOn,
      removeFolderFromList,
    });

    // Assert
    expect(deleteFolderById).not.toHaveBeenCalled();
    expect(removeFolderFromList).not.toHaveBeenCalled();
  });

  it('deletes empty folder and removes it from the list', async () => {
    // Arrange
    vi.mocked(folderHasChildFolders).mockResolvedValue(false);
    vi.mocked(countNotesInFolder).mockResolvedValue(0);
    vi.mocked(deleteFolderById).mockResolvedValue(undefined);

    // Act
    await maybePruneEmptyFolder({
      folderId: 'folder-1',
      userPreferences: prefsOn,
      removeFolderFromList,
    });

    // Assert
    expect(deleteFolderById).toHaveBeenCalledWith({}, 'folder-1');
    expect(removeFolderFromList).toHaveBeenCalledWith('folder-1');
  });
});
