import { NotesGraphScreen } from '@nota/note-graph';
import type { JSX } from 'react';
import { useNotesDataVault } from '@nota/note-runtime/notes-data-context';
import { navigateFromLegacyPath } from '@nota/app-navigation-core/navigation';
import { useNotaTranslator } from '@/lib/use-nota-translator';

export default function NotesGraph(): JSX.Element {
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
