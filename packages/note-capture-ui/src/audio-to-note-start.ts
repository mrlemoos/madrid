import type { Note } from '@nota/database-types';
import { setAppHash } from '@nota/app-navigation-core/navigation';
import { getBrowserClient } from '@nota/data-source/supabase/browser';
import { createLocalOnlyNote } from '@nota/notes-offline';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import { createNote } from '@nota/data-source/models/notes';
import { useAudioToNoteSession } from '@nota/note-runtime/stores/audio-session';
import { studyNotePlaceholderRecordingTitle } from '@nota/note-capture-core/study-note-title';

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
    setAppHash({ kind: 'notes', panel: 'note', noteId: id });
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
