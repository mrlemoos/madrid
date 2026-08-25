import { buildNoteLinkGraph, notesToIdMap } from '@nota/note-link-graph';
import { useDeferredValue, useMemo, type JSX } from 'react';
import { cn } from '@nota/design/utils';
import { useNoteEditorTranslator } from './use-note-editor-translator';
import {
  NOTA_PRESSABLE_CLASS,
  NOTA_CHROME_NAV_ITEM_CLASS,
} from '@nota/nota-motion-ui/interaction';
import { useNotesDataVault } from '@nota/note-runtime/notes-data-context';
import { useAppNavigationScreen } from '@nota/app-navigation-ui/use-app-navigation-screen';
import { noteHashHref } from '@nota/note-editor-core/note-hash-href';
import { markNavIntent } from '@nota/nota-motion-ui/panel-motion';
import Link from 'next/link';

export function NoteBacklinksPanel({
  noteId,
}: {
  noteId: string;
}): JSX.Element {
  const { t } = useNoteEditorTranslator();
  const { notes } = useNotesDataVault();
  const deferredNotes = useDeferredValue(notes);
  const screen = useAppNavigationScreen();

  const { backlinkIds, byId } = useMemo(() => {
    const { backlinks } = buildNoteLinkGraph(deferredNotes);
    const ids = [...(backlinks.get(noteId) ?? [])].sort();
    const map = notesToIdMap(deferredNotes);
    return { backlinkIds: ids, byId: map };
  }, [deferredNotes, noteId]);

  return (
    <section
      className="border-t border-border/40 pt-6"
      aria-labelledby="note-backlinks-heading"
    >
      <h2
        id="note-backlinks-heading"
        className="mb-3 text-sm font-medium text-foreground"
      >
        {t('Backlinks')}
      </h2>
      {backlinkIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('No other notes link here yet.')}
        </p>
      ) : (
        <ul className="space-y-1">
          {backlinkIds.map((id) => {
            const note = byId.get(id);
            if (!note) return null;
            const label = note.title.trim() ? note.title : t('Untitled Note');
            const isActive =
              screen.kind === 'notes' &&
              screen.panel === 'note' &&
              screen.noteId === id;
            return (
              <li key={id}>
                <Link
                  href={noteHashHref(id)}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    markNavIntent('pointer');
                  }}
                  className={cn(
                    NOTA_CHROME_NAV_ITEM_CLASS,
                    NOTA_PRESSABLE_CLASS,
                    'block rounded-md px-2 py-1.5 text-sm',
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
