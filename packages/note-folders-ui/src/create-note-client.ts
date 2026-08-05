import { navigateToScreen } from '@nota/app-navigation-core/navigation';
import { vaultMutator } from '@nota/data-source/vault-runtime';
import { recordWritingActivityToday } from '@nota/writing-activity-ui/tracking';
import type { Note } from '@nota/database-types';

export async function clientCreateNote(options: {
  userId: string;
  insertNoteAtFront: (n: Note) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
  notaProEntitled: boolean;
  /** Omit or `null` = new untitled note at root. UUID string = new note in that folder. */
  folderId?: string | null;
  notes?: Pick<Note, 'id' | 'folder_id'>[];
}): Promise<void> {
  const { userId, folderId } = options;
  if (!userId || !options.notaProEntitled) {
    return;
  }

  const result = await vaultMutator.createNote(userId, { folderId });

  recordWritingActivityToday();

  const noteId =
    result.outcome === 'created-remote' ? result.note.id : result.noteId;

  if (result.outcome === 'created-remote') {
    options.insertNoteAtFront(result.note);
  }

  navigateToScreen({ kind: 'notes', panel: 'note', noteId });
  await options.refreshNotesList({ silent: true });
}
