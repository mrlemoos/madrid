import {
  countNotesInFolder,
  deleteFolderById,
  folderHasChildFolders,
} from '@getmadrid/data-source/models/folders';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import { isLikelyOnline } from '@getmadrid/data-source/notes-offline-sync';
import type { UserPreferences } from '@getmadrid/database-types';

/**
 * When the user preference is enabled, deletes a folder that has zero notes left.
 */
export async function maybePruneEmptyFolder(options: {
  folderId: string | null | undefined;
  userPreferences: UserPreferences | null;
  removeFolderFromList: (id: string) => void;
}): Promise<void> {
  const { folderId, userPreferences, removeFolderFromList } = options;
  if (!folderId) {
    return;
  }
  if (userPreferences?.delete_empty_folders !== true) {
    return;
  }
  if (!isLikelyOnline()) {
    return;
  }

  const client = getBrowserClient();
  try {
    const hasChildFolders = await folderHasChildFolders(client, folderId);
    if (hasChildFolders) {
      return;
    }
    const count = await countNotesInFolder(client, folderId);
    if (count !== 0) {
      return;
    }
    await deleteFolderById(client, folderId);
    removeFolderFromList(folderId);
  } catch {
    /* list refresh can reconcile */
  }
}
