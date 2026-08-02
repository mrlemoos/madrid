import { useEffect, useRef, type JSX } from 'react';
import { cn } from '@nota/web-design/utils';
import { electronWindowDragClasses } from '@nota/electron-bridge-core/window-chrome';
import { useNotesSidebarStore } from '@nota/note-runtime/stores/sidebar';
import { useIsElectron } from './use-is-electron.js';

const HIDE_GRACE_MS = 400;

/**
 * Hides the macOS traffic lights while the notes sidebar is closed and the
 * notes shell is mounted. While hidden, a top-left hover zone (marked no-drag
 * so it receives mouse events inside the drag band) re-shows the buttons on
 * enter and re-hides them after a short grace delay on leave. Layout keeps the
 * traffic-light inset reserved; only the buttons snap in/out.
 */
export function ElectronTrafficLightsController(): JSX.Element | null {
  const isElectron = useIsElectron();
  const sidebarOpen = useNotesSidebarStore((s) => s.open);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { noDrag } = electronWindowDragClasses();

  const setVisible = (visible: boolean): void => {
    void window.nota?.setWindowButtonVisibility?.(visible);
  };

  useEffect(() => {
    if (!isElectron) {
      return;
    }
    setVisible(sidebarOpen);
    return () => {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      // Leaving the notes shell (or reopening the sidebar): buttons back.
      void window.nota?.setWindowButtonVisibility?.(true);
    };
  }, [isElectron, sidebarOpen]);

  if (!isElectron || sidebarOpen) {
    return null;
  }

  return (
    <div
      aria-hidden
      className={cn(
        noDrag,
        'fixed top-0 left-0 z-40 w-20',
        'h-[calc(52px+env(safe-area-inset-top,0))]',
      )}
      onMouseEnter={() => {
        if (hideTimerRef.current !== null) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setVisible(true);
      }}
      onMouseLeave={() => {
        hideTimerRef.current = setTimeout(() => {
          hideTimerRef.current = null;
          setVisible(false);
        }, HIDE_GRACE_MS);
      }}
    />
  );
}
