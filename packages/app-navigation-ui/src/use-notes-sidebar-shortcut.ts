import { useEffect, useEffectEvent } from 'react';
import { useNotesSidebarStore } from '@getmadrid/note-runtime/stores/sidebar';

export function useNotesSidebarShortcut(
  userId: string | undefined,
  enabled = true,
): void {
  const onKeyDown = useEffectEvent((e: KeyboardEvent): void => {
    if (!userId || !enabled) {
      return;
    }

    const mod = e.metaKey || e.ctrlKey;
    if (!mod || (e.key !== 's' && e.key !== 'S') || e.shiftKey || e.altKey) {
      return;
    }

    const t = e.target;
    if (
      t instanceof Element &&
      (t.closest('[data-nota-command-palette]') ||
        t.closest('input, textarea, select, [contenteditable="true"]'))
    ) {
      return;
    }

    e.preventDefault();
    useNotesSidebarStore.getState().toggle();
  });

  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userId, enabled, onKeyDown]);
}
