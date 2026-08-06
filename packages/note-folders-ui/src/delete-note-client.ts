import { navigateToScreen } from '@nota/app-navigation-core/navigation';
import { maybePruneEmptyFolder } from './maybe-prune-empty-folder';
import { vaultMutator } from '@nota/data-source/vault-runtime';
import type { UserPreferences } from '@nota/database-types';

export async function clientDeleteNoteById(
  noteId: string,
  options: {
    userId: string;
    removeNoteFromList: (id: string) => void;
    removeFolderFromList: (id: string) => void;
    refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
    notaProEntitled: boolean;
    /** Folder the note belonged to, if any, so empty folders can be pruned. */
    noteFolderId: string | null;
    userPreferences: UserPreferences | null;
  },
): Promise<void> {
  const { userId } = options;
  if (!userId || !options.notaProEntitled) {
    return;
  }

  const result = await vaultMutator.deleteNote(userId, noteId);

  options.removeNoteFromList(noteId);
  navigateToScreen({ kind: 'notes', panel: 'list', noteId: null });
  await maybePruneEmptyFolder({
    folderId: options.noteFolderId,
    userPreferences: options.userPreferences,
    removeFolderFromList: options.removeFolderFromList,
  });

  if (result.outcome === 'deleted-remote') {
    await options.refreshNotesList({ silent: true });
  }
}
