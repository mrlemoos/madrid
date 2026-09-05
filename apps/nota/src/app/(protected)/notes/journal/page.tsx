'use client';

import type { JSX } from 'react';
import { JournalScreen } from '@getmadrid/note-journal-ui/journal-screen';
import { navigateFromLegacyPath } from '@getmadrid/app-navigation-core/navigation';

/** `/notes/journal` — the daily-notes journal. */
export default function NotesJournalPage(): JSX.Element {
  return (
    <JournalScreen
      onOpenNote={(id) => {
        navigateFromLegacyPath(`/notes/${id}`);
      }}
    />
  );
}
