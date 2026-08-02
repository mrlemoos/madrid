import { hashForScreen } from '@nota/app-navigation-core/navigation';

/** Hash href for sidebar / backlinks (native link behaviour). */
export function noteHashHref(noteId: string): string {
  return hashForScreen({
    kind: 'notes',
    panel: 'note',
    noteId,
  });
}
