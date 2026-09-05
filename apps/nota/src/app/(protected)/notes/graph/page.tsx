'use client';

import { NotesGraphScreen } from '@getmadrid/note-graph';
import type { JSX } from 'react';
import { useNotesDataVault } from '@getmadrid/note-runtime/notes-data-context';
import { navigateFromLegacyPath } from '@getmadrid/app-navigation-core/navigation';
import { useNotaTranslator } from '@/lib/use-nota-translator';

/** `/notes/graph` — the note link graph. */
export default function NotesGraphPage(): JSX.Element {
  const { notes } = useNotesDataVault();
  const { t } = useNotaTranslator();

  return (
    <NotesGraphScreen
      notes={notes}
      onOpenNote={(id) => {
        navigateFromLegacyPath(`/notes/${id}`, { intent: 'pointer' });
      }}
      t={t}
    />
  );
}
