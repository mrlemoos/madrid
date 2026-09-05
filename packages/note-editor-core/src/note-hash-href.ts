import { pathForScreen } from '@getmadrid/app-navigation-core/navigation';

/** Hash href for sidebar / backlinks (native link behaviour). */
export function noteHashHref(noteId: string): string {
  return pathForScreen({
    kind: 'notes',
    panel: 'note',
    noteId,
  });
}
