import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  animateSprings,
  createCriticallyDampedSpringConfig,
  type SpringAnimationHandle,
} from '@nota/nota-motion-core/critically-damped-spring';
import { NOTA_SPRING_PRESETS } from './nota-motion';
import {
  computeSidebarResizeLiveWidth,
  resolveSidebarResizeSettle,
} from '@nota/nota-motion-core/sidebar-resize-settle';
import {
  clampNotaSidebarWidthPx,
  NOTA_SIDEBAR_MAX_WIDTH_PX,
  NOTA_SIDEBAR_MIN_WIDTH_PX,
} from '@nota/nota-motion-core/sidebar-width';

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
  const velocityPxPerSecRef = useRef(0);
  const lastSampleRef = useRef<{ t: number; x: number } | null>(null);
  const settleHandleRef = useRef<SpringAnimationHandle | null>(null);
  const captureTargetRef = useRef<HTMLDivElement | null>(null);
  const capturePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    startWidthRef.current = options.widthPx;
    liveWidthRef.current = options.widthPx;
  }, [options.widthPx]);

  const clearResizeSession = (): void => {
    isResizingRef.current = false;
    lastSampleRef.current = null;
    document.body.style.removeProperty('user-select');
    document.body.style.removeProperty('cursor');
    const target = captureTargetRef.current;
    const pointerId = capturePointerIdRef.current;
    if (target && pointerId != null && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
    captureTargetRef.current = null;
    capturePointerIdRef.current = null;
  };

  const applyLiveWidth = (widthPx: number): void => {
    liveWidthRef.current = widthPx;
    const el = options.asideRef.current;
    if (el) {
      setSidebarWidths(el, options.railRef?.current ?? null, widthPx);
    }
  };

  const commitSettledWidth = (widthPx: number): void => {
    const next = clampNotaSidebarWidthPx(widthPx);
    liveWidthRef.current = next;
    applyLiveWidth(next);
    options.setSidebarWidthPx(next);
  };

  const startSettleSpring = (
    fromWidthPx: number,
    velocityPxPerSec: number,
  ): void => {
    settleHandleRef.current?.stop();
    settleHandleRef.current = null;

    const settle = resolveSidebarResizeSettle({
      widthPx: fromWidthPx,
      velocityPxPerSec,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    if (Math.abs(fromWidthPx - settle.targetWidthPx) < 0.5) {
      commitSettledWidth(settle.targetWidthPx);
      return;
    }

    const shell = NOTA_SPRING_PRESETS.shell;
    const config = createCriticallyDampedSpringConfig(
      shell.response,
      shell.damping,
    );
    settleHandleRef.current = animateSprings({
      from: {
        width: {
          value: fromWidthPx,
          velocity: settle.initialVelocityPxPerSec,
        },
      },
      to: { width: settle.targetWidthPx },
      config,
      onUpdate: (values) => {
        applyLiveWidth(values.width);
      },
      onComplete: () => {
        settleHandleRef.current = null;
        commitSettledWidth(settle.targetWidthPx);
      },
    });
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent): void => {
      if (!isResizingRef.current) {
        return;
      }
      const now = performance.now();
      const last = lastSampleRef.current;
      if (last) {
        const dtS = (now - last.t) / 1000;
        if (dtS > 0) {
          velocityPxPerSecRef.current = (event.clientX - last.x) / dtS;
        }
      }
      lastSampleRef.current = { t: now, x: event.clientX };

      const delta = event.clientX - startXRef.current;
      const next = computeSidebarResizeLiveWidth({
        startWidthPx: startWidthRef.current,
        deltaPx: delta,
        minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
        maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
      });
      applyLiveWidth(next);
    };

    const onPointerUp = (): void => {
      if (!isResizingRef.current) {
        return;
      }
      const fromWidth = liveWidthRef.current;
      const velocity = velocityPxPerSecRef.current;
      clearResizeSession();
      startSettleSpring(fromWidth, velocity);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      settleHandleRef.current?.stop();
      settleHandleRef.current = null;
      clearResizeSession();
    };
  }, [options.asideRef, options.railRef, options.setSidebarWidthPx]);

  const onResizePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (!options.open) {
      return;
    }
    event.preventDefault();
    settleHandleRef.current?.stop();
    settleHandleRef.current = null;
    isResizingRef.current = true;
    startXRef.current = event.clientX;
    startWidthRef.current = options.widthPx;
    liveWidthRef.current = options.widthPx;
    velocityPxPerSecRef.current = 0;
    lastSampleRef.current = {
      t: performance.now(),
      x: event.clientX,
    };
    captureTargetRef.current = event.currentTarget;
    capturePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  return { isResizingRef, onResizePointerDown };
}
