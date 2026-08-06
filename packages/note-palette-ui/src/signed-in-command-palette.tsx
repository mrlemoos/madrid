import { CommandPalette } from './command-palette';
import { useRootLoaderData } from '@nota/note-runtime/session-context';
import { useOptionalNotesDataMeta } from '@nota/note-runtime/notes-data-context';

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
