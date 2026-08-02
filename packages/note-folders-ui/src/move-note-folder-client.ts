import { maybePruneEmptyFolder } from './maybe-prune-empty-folder.js';
import { vaultMutator } from '@nota/data-source/vault-runtime';
import type { Note, UserPreferences } from '@nota/database-types';

export async function clientMoveNoteToFolder(options: {
  noteId: string;
  targetFolderId: string | null;
  previousFolderId: string | null;
  userId: string;
  notaProEntitled: boolean;
  userPreferences: UserPreferences | null;
  patchNoteInList: (id: string, patch: Partial<Note>) => void;
  removeFolderFromList: (id: string) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
}): Promise<void> {
  const {
    noteId,
    targetFolderId,
    previousFolderId,
    userId,
    notaProEntitled,
    userPreferences,
    patchNoteInList,
    removeFolderFromList,
    refreshNotesList,
  } = options;

  if (!userId || !notaProEntitled) {
    return;
  }

  const result = await vaultMutator.patchNote(userId, {
    noteId,
    fields: { folder_id: targetFolderId },
  });

  if (result.outcome === 'patched-remote') {
    patchNoteInList(noteId, { folder_id: result.note.folder_id });
  } else {
    patchNoteInList(noteId, { folder_id: targetFolderId });
  }

  await maybePruneEmptyFolder({
    folderId: previousFolderId,
    userPreferences,
    removeFolderFromList,
  });
  await refreshNotesList({ silent: true });
}
