import type { Note } from '@nota/database-types';
import { localDateKey } from '@nota/note-journal-core/local-date-key';

export { localDateKey };

/** Title for a daily note: local calendar date, e.g. "4 March 2026". */
export function dailyNoteDisplayTitle(at: Date): string {
  return at.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns the note id mapped to `dateKey` if that id still exists in `notes`
 * as a **root** note (`folder_id` null). Otherwise returns `null` (caller should
 * drop the stale map entry when the note moved into a folder or was deleted).
 */
export function resolveTodaysNoteId(
  notes: Pick<Note, 'id' | 'folder_id'>[],
  map: Record<string, string>,
  dateKey: string,
): string | null {
  const id = map[dateKey];
  if (!id) {
    return null;
  }
  return notes.some((n) => n.id === id && n.folder_id == null) ? id : null;
}
