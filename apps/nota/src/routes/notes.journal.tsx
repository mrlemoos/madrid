import type { JSX } from 'react';
import { JournalScreen } from '@nota/note-journal-ui/journal-screen';
import { navigateFromLegacyPath } from '@nota/app-navigation-core/navigation';

export default function NotesJournal(): JSX.Element {
  return (
    <JournalScreen
      onOpenNote={(id) => {
        navigateFromLegacyPath(`/notes/${id}`);
      }}
    />
  );
}
