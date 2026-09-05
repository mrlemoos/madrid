export type {
  LocalNoteMeta,
  OutboxEntry,
  OutboxKind,
  StoredNote,
} from '@getmadrid/notes-offline-core';
export { DEFAULT_NOTE_CONTENT } from '@getmadrid/notes-offline-core';
export {
  closeNotaNotesDb,
  deleteNotaNotesDb,
  getNotaNotesDb,
  idbRequest,
  NOTES_OBJECT_STORE,
  OUTBOX_OBJECT_STORE,
  transactionComplete,
} from './lib/db';
export {
  createLocalOnlyNote,
  getStoredNote,
  listStoredNotes,
  markNoteSyncedFromServer,
  markPendingDelete,
  putServerNoteIfNotDirty,
  removeStoredNote,
  saveLocalNoteDraft,
} from './lib/local-note-store';
export {
  listOutbox,
  removeOutboxEntry,
  sortOutboxForProcessing,
} from './lib/outbox';
export {
  mergeNoteLists,
  mergeNoteWithLocal,
  storedNoteToListRow,
} from '@getmadrid/notes-offline-core';
