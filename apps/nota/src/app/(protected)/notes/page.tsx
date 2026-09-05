'use client';

import type { JSX } from 'react';
import { NotesIndexPanel } from '@getmadrid/notes-chrome-ui/notes-chrome-parts';
import { useNotesData } from '@getmadrid/note-runtime/notes-data-context';
import { useRootLoaderData } from '@getmadrid/note-runtime/session-context';
import { clientCreateNote } from '@getmadrid/note-folders-ui/create-note-client';

/** `/notes` — the vault empty/index panel (create + writing-activity graph). */
export default function NotesListPage(): JSX.Element {
  const { user } = useRootLoaderData();
  const { notes, notaProEntitled, insertNoteAtFront, refreshNotesList } =
    useNotesData();

  return (
    <NotesIndexPanel
      onCreate={() => {
        if (!user?.id) {
          return;
        }
        void clientCreateNote({
          userId: user.id,
          insertNoteAtFront,
          refreshNotesList,
          notaProEntitled,
          notes,
        });
      }}
    />
  );
}
