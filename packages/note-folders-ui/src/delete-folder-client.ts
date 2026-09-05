import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import { isLikelyOnline } from '@getmadrid/data-source/notes-offline-sync';
import {
  deleteNote,
  listNoteIdsInFolderSubtree,
  moveAllNotesInFolderSubtree,
} from '@getmadrid/data-source/models/notes';
import {
  deleteFolderById,
  listFolders,
} from '@getmadrid/data-source/models/folders';
import { subtreeFolderIds } from '@getmadrid/note-folders-core/folder-tree';

export async function clientMoveAllNotesThenDeleteFolder(options: {
  folderId: string;
  targetFolderId: string | null;
  removeFolderFromList: (id: string) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
}): Promise<void> {
  if (!isLikelyOnline()) {
    throw new Error('Moving folders requires an internet connection.');
  }
  const client = getBrowserClient();
  const allFolders = await listFolders(client);
  await moveAllNotesInFolderSubtree(
    client,
    options.folderId,
    options.targetFolderId,
    allFolders,
  );
  const removedFolderIds = subtreeFolderIds(options.folderId, allFolders);
  await deleteFolderById(client, options.folderId);
  for (const id of removedFolderIds) {
    options.removeFolderFromList(id);
  }
  await options.refreshNotesList({ silent: true });
}

export async function clientDeleteAllNotesInFolderThenDeleteFolder(options: {
  folderId: string;
  removeNoteFromList: (id: string) => void;
  removeFolderFromList: (id: string) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
}): Promise<void> {
  if (!isLikelyOnline()) {
    throw new Error('Deleting a folder requires an internet connection.');
  }
  const client = getBrowserClient();
  const allFolders = await listFolders(client);
  const ids = await listNoteIdsInFolderSubtree(
    client,
    options.folderId,
    allFolders,
  );
  for (const id of ids) {
    await deleteNote(client, id);
    options.removeNoteFromList(id);
  }
  const removedFolderIds = subtreeFolderIds(options.folderId, allFolders);
  await deleteFolderById(client, options.folderId);
  for (const id of removedFolderIds) {
    options.removeFolderFromList(id);
  }
  await options.refreshNotesList({ silent: true });
}
