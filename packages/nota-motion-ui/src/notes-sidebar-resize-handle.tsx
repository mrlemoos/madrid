import type { JSX, PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@nota/design/utils';

/** CSS class from Electron chrome — keep drag-region off the resize grip. */
const ELECTRON_WINDOW_NO_DRAG_CLASS = 'electron-window-no-drag';

export function NotesSidebarResizeHandle({
  ariaLabel,
  onPointerDown,
}: {
  ariaLabel: string;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}): JSX.Element {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      tabIndex={-1}
      onPointerDown={onPointerDown}
      className={cn(
        'nota-sidebar-resize-handle',
        ELECTRON_WINDOW_NO_DRAG_CLASS,
      )}
    />
  );
}
