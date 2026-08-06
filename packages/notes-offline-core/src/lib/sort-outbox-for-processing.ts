import type { OutboxEntry } from './types';

/** Process deletes after upserts for the same note id to avoid invalid API order. */
export function sortOutboxForProcessing(entries: OutboxEntry[]): OutboxEntry[] {
  return [...entries].sort((a, b) => {
    if (a.noteId !== b.noteId) {
      return a.noteId.localeCompare(b.noteId);
    }
    if (a.kind === b.kind) return 0;
    return a.kind === 'upsert' ? -1 : 1;
  });
}
