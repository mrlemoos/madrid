import type { Folder } from '@getmadrid/database-types';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import { isLikelyOnline } from '@getmadrid/data-source/notes-offline-sync';
import { updateFolder } from '@getmadrid/data-source/models/folders';

export async function clientRenameFolder(options: {
  folderId: string;
  previousName: string;
  nextName: string;
  userId: string;
  notaProEntitled: boolean;
  patchFolderInList: (id: string, patch: Partial<Folder>) => void;
}): Promise<void> {
  const {
    folderId,
    previousName,
    nextName,
    userId,
    notaProEntitled,
    patchFolderInList,
  } = options;

  if (!userId || !notaProEntitled) {
    return;
  }

  const trimmed = nextName.trim();
  if (!trimmed || trimmed === previousName) {
    return;
  }

  patchFolderInList(folderId, { name: trimmed });

  if (!isLikelyOnline()) {
    return;
  }

  try {
    const client = getBrowserClient();
    const row = await updateFolder(client, folderId, { name: trimmed });
    patchFolderInList(folderId, { name: row.name });
  } catch {
    return;
  }
}
