import { CommandPalette } from './command-palette';
import { useRootLoaderData } from '@getmadrid/note-runtime/session-context';
import { useOptionalNotesDataMeta } from '@getmadrid/note-runtime/notes-data-context';

export function SignedInCommandPalette() {
  const { user } = useRootLoaderData();
  const meta = useOptionalNotesDataMeta();
  const notesUnlocked = !!meta && !meta.loading;

  if (!user) {
    return null;
  }

  if (!notesUnlocked) {
    return null;
  }

  return <CommandPalette />;
}
