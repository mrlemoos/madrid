import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { clampNotaSidebarWidthPx } from '@/lib/nota-sidebar-width';

function setSidebarWidths(
  asideEl: HTMLElement,
  railEl: HTMLElement | null,
  widthPx: number,
): void {
  const width = `${String(widthPx)}px`;
  asideEl.style.width = width;
  if (railEl) {
    railEl.style.width = width;
  }
}

export function useNotesSidebarResize(options: {
  asideRef: React.RefObject<HTMLElement | null>;
  railRef?: React.RefObject<HTMLElement | null>;
  open: boolean;
  widthPx: number;
  setSidebarWidthPx: (widthPx: number) => void;
}): {
  isResizingRef: React.RefObject<boolean>;
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
} {
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(options.widthPx);
  const liveWidthRef = useRef(options.widthPx);

  useEffect(() => {
    startWidthRef.current = options.widthPx;
    liveWidthRef.current = options.widthPx;
  }, [options.widthPx]);

  const clearResizeSession = (): void => {
    isResizingRef.current = false;
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');
  };

  const commitWidth = (clientX: number): void => {
    const delta = clientX - startXRef.current;
    const next = clampNotaSidebarWidthPx(startWidthRef.current + delta);
    liveWidthRef.current = next;
    const el = options.asideRef.current;
    if (el) {
      setSidebarWidths(el, options.railRef?.current ?? null, next);
    }
    options.setSidebarWidthPx(next);
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent): void => {
      if (!isResizingRef.current) {
        return;
      }
      const delta = event.clientX - startXRef.current;
      const next = clampNotaSidebarWidthPx(startWidthRef.current + delta);
      liveWidthRef.current = next;
      const el = options.asideRef.current;
      if (el) {
        setSidebarWidths(el, options.railRef?.current ?? null, next);
      }
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (!isResizingRef.current) {
        return;
      }
      commitWidth(event.clientX);
      clearResizeSession();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      clearResizeSession();
    };
    // commitWidth reads refs + aside width; listing it would rebind window listeners every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commitWidth
  }, [options.asideRef, options.railRef, options.setSidebarWidthPx]);

  const onResizePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (!options.open) {
      return;
    }
    event.preventDefault();
    isResizingRef.current = true;
    startXRef.current = event.clientX;
    startWidthRef.current = options.widthPx;
    liveWidthRef.current = options.widthPx;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  return { isResizingRef, onResizePointerDown };
}
