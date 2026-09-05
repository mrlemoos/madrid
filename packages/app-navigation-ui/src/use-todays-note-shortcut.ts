import { useEffect, useEffectEvent, useRef } from 'react';
import { openTodaysNoteClient } from './open-todays-note';
import type { Note } from '@getmadrid/database-types';
import { navigateFromLegacyPath } from '@getmadrid/app-navigation-core/navigation';
import { useOptionalNotesDataActions } from '@getmadrid/note-runtime/notes-data-context';

export function useTodaysNoteShortcut(
  notes: Pick<Note, 'id' | 'folder_id'>[],
  userId: string | undefined,
  enabled: boolean,
  notaProEntitled: boolean,
): void {
  const actions = useOptionalNotesDataActions();
  const refreshRef = useRef(actions?.refreshNotesList);
  refreshRef.current = actions?.refreshNotesList;

  const onKeyDown = useEffectEvent((e: KeyboardEvent): void => {
    if (!enabled || !userId) {
      return;
    }

    const mod = e.metaKey || e.ctrlKey;
    if (!mod || (e.key !== 'd' && e.key !== 'D') || e.shiftKey || e.altKey) {
      return;
    }

    const t = e.target;
    if (t instanceof Element && t.closest('[data-nota-command-palette]')) {
      return;
    }

    e.preventDefault();

    void openTodaysNoteClient({
      notes,
      userId,
      navigate: navigateFromLegacyPath,
      revalidate: () => {
        void refreshRef.current?.({ silent: true });
      },
      notaProEntitled,
    });
  });

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, userId, onKeyDown]);
}
