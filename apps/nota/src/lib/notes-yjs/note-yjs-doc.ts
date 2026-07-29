import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';

/** IndexedDB database name for a note's Yjs doc. Keep stable — changing it orphans local docs. */
export function noteYjsDocKey(noteId: string): string {
  return `nota-note-yjs-${noteId}`;
}

/**
 * Create a note's Yjs doc plus its local IndexedDB persistence. The persistence
 * makes local edits durable and queues them offline; the returned `whenSynced`
 * resolves once the on-disk state has loaded into the doc.
 */
export function createNoteYjsDoc(noteId: string): {
  doc: Y.Doc;
  persistence: IndexeddbPersistence;
} {
  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(noteYjsDocKey(noteId), doc);
  return { doc, persistence };
}
