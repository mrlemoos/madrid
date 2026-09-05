import type { Note } from '@getmadrid/database-types';
import { navigateToScreen } from '@getmadrid/app-navigation-core/navigation';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import { createLocalOnlyNote } from '@getmadrid/notes-offline';
import { isLikelyOnline } from '@getmadrid/data-source/notes-offline-sync';
import { createNote } from '@getmadrid/data-source/models/notes';
import { useAudioToNoteSession } from '@getmadrid/note-runtime/stores/audio-session';
import { studyNotePlaceholderRecordingTitle } from '@getmadrid/note-capture-core/study-note-title';

/**
 * Creates a note and opens the assistive audio-to-note capture session (microphone + upload).
 */
export async function startStudyNotesFromRecording(options: {
  userId: string;
  notaProEntitled: boolean;
  insertNoteAtFront: (n: Note) => void;
  refreshNotesList: (o?: { silent?: boolean }) => Promise<void>;
}): Promise<void> {
  if (!options.notaProEntitled || !options.userId) {
    return;
  }

  const goToNote = (id: string): void => {
    navigateToScreen({ kind: 'notes', panel: 'note', noteId: id });
  };

  if (!isLikelyOnline()) {
    const id = await createLocalOnlyNote(
      options.userId,
      studyNotePlaceholderRecordingTitle(),
    );
    goToNote(id);
    await options.refreshNotesList({ silent: true });
    useAudioToNoteSession.getState().beginSession(id);
    return;
  }

  const c = getBrowserClient();
  try {
    const row = await createNote(
      c,
      options.userId,
      studyNotePlaceholderRecordingTitle(),
    );
    options.insertNoteAtFront(row);
    goToNote(row.id);
    await options.refreshNotesList({ silent: true });
    useAudioToNoteSession.getState().beginSession(row.id);
  } catch {
    const id = await createLocalOnlyNote(
      options.userId,
      studyNotePlaceholderRecordingTitle(),
    );
    goToNote(id);
    await options.refreshNotesList({ silent: true });
    useAudioToNoteSession.getState().beginSession(id);
  }
}

/**
 * Starts assistive capture for the note already open in the shell: merges generated
 * content after the existing body and keeps the current title.
 */
export function startStudyNotesAppendToOpenNote(options: {
  userId: string;
  notaProEntitled: boolean;
  openNoteId: string;
}): void {
  if (!options.notaProEntitled || !options.userId || !options.openNoteId) {
    return;
  }
  useAudioToNoteSession
    .getState()
    .beginSession(options.openNoteId, { append: true });
}
