import type { JSX } from 'react';
import { cn } from '@getmadrid/design/utils';
import { electronWindowDragClasses } from '@getmadrid/electron-bridge-core/window-chrome';
import { useIsElectron } from './use-is-electron';

/**
 * Fixed top band so the window can be dragged when using a hidden title bar (Electron
 * `titleBarStyle: 'hiddenInset'`). Clears the traffic-light inset (`left-20`).
 */
export function ElectronWindowDragBand(): JSX.Element | null {
  const isElectron = useIsElectron();
  const { drag } = electronWindowDragClasses();

  if (!isElectron) {
    return null;
  }

  return (
    <div
      aria-hidden
      className={cn(
        drag,
        'pointer-events-auto fixed top-0 right-0 left-20 z-30',
        'h-[calc(52px+env(safe-area-inset-top,0))]',
      )}
    />
  );
}
