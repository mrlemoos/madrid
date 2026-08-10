import { useEffect, useEffectEvent } from 'react';
import { useNotaZoomStore } from '@nota/note-runtime/stores/zoom';

/**
 * ⌘= / ⌘- / ⌘0 (Ctrl on other platforms) drive the app's own zoom instead of the
 * browser's, so the packaged desktop app and the web app scale identically.
 */
export function useNotaZoomShortcut(
  userId: string | undefined,
  enabled = true,
): void {
  const onKeyDown = useEffectEvent((e: KeyboardEvent): void => {
    if (!userId || !enabled) {
      return;
    }

    const mod = e.metaKey || e.ctrlKey;
    if (!mod || e.altKey) {
      return;
    }

    // ⌘+ arrives as '+' (shifted) or '=' on most layouts; ⌘= is the unshifted form.
    const key = e.key;
    const run =
      key === '=' || key === '+'
        ? useNotaZoomStore.getState().zoomIn
        : key === '-' || key === '_'
          ? useNotaZoomStore.getState().zoomOut
          : key === '0'
            ? useNotaZoomStore.getState().resetZoom
            : null;
    if (!run) {
      return;
    }

    const t = e.target;
    if (t instanceof Element && t.closest('[data-nota-command-palette]')) {
      return;
    }

    e.preventDefault();
    run();
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
