import { useEffect, useRef, useState, type JSX } from 'react';
import { cn } from '@getmadrid/design/utils';
import { electronWindowDragClasses } from '@getmadrid/electron-bridge-core/window-chrome';
import { useNotesSidebarStore } from '@getmadrid/note-runtime/stores/sidebar';
import { useIsElectron } from './use-is-electron';

const HIDE_GRACE_MS = 400;

const TRAFFIC_LIGHT_OUTLINE_KEYS = ['close', 'minimise', 'zoom'] as const;

type ElectronTrafficLightsControllerProps = {
  /** Ghost rings over a banner while native buttons stay hidden. */
  hasBanner?: boolean;
};

/**
 * Hides the macOS traffic lights while the notes sidebar is closed and the
 * notes shell is mounted. While hidden, a top-left hover zone (marked no-drag
 * so it receives mouse events inside the drag band) re-shows the buttons on
 * enter and re-hides them after a short grace delay on leave. Layout keeps the
 * traffic-light inset reserved; only the buttons snap in/out.
 *
 * When the open note has a banner, faint rings mark where the buttons sit so
 * the chrome still reads over the photo. Hover behaviour is unchanged.
 */
export function ElectronTrafficLightsController({
  hasBanner = false,
}: ElectronTrafficLightsControllerProps = {}): JSX.Element | null {
  const isElectron = useIsElectron();
  const sidebarOpen = useNotesSidebarStore((s) => s.open);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoverRevealed, setHoverRevealed] = useState(false);
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
      data-testid="electron-traffic-lights-hover-zone"
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
        setHoverRevealed(true);
        setVisible(true);
      }}
      onMouseLeave={() => {
        hideTimerRef.current = setTimeout(() => {
          hideTimerRef.current = null;
          setHoverRevealed(false);
          setVisible(false);
        }, HIDE_GRACE_MS);
      }}
    >
      {hasBanner ? (
        <div
          data-testid="electron-traffic-light-outlines"
          data-hover-revealed={hoverRevealed ? 'true' : 'false'}
          className="electron-traffic-light-outlines"
        >
          {TRAFFIC_LIGHT_OUTLINE_KEYS.map((key) => (
            <span key={key} data-traffic-light-outline={key} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
