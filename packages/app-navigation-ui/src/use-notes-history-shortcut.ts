import { useEffect, useEffectEvent } from 'react';
import { markNavIntent } from '@nota/nota-motion-ui/panel-motion';

export function useNotesHistoryShortcut(
  userId: string | undefined,
  enabled = true,
): void {
  const onKeyDown = useEffectEvent((e: KeyboardEvent): void => {
    if (!userId || !enabled) {
      return;
    }

    const mod = e.metaKey || e.ctrlKey;
    if (!mod || e.shiftKey || e.altKey) {
      return;
    }

    if (e.key !== '[' && e.key !== ']') {
      return;
    }

    const t = e.target;
    if (t instanceof Element && t.closest('[data-nota-command-palette]')) {
      return;
    }

    e.preventDefault();
    markNavIntent('keyboard');
    if (e.key === '[') {
      window.history.back();
    } else {
      window.history.forward();
    }
  });

  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [userId, enabled, onKeyDown]);
}
