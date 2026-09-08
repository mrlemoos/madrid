import { renderHook } from '@testing-library/react';
import { act, createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOTA_SIDEBAR_MAX_WIDTH_PX,
  NOTA_SIDEBAR_MIN_WIDTH_PX,
} from '@getmadrid/nota-motion-core/sidebar-width';

import { useNotesSidebarResize } from './use-notes-sidebar-resize';

/** Drives the settle spring straight to its target so tests stay synchronous. */
const stop = vi.fn();
vi.mock('@getmadrid/nota-motion-core/critically-damped-spring', async () => {
  const actual = await vi.importActual<
    typeof import('@getmadrid/nota-motion-core/critically-damped-spring')
  >('@getmadrid/nota-motion-core/critically-damped-spring');
  return {
    ...actual,
    animateSprings: vi.fn(
      (spec: {
        to: { width: number };
        onUpdate: (v: { width: number }) => void;
        onComplete: () => void;
      }) => {
        spec.onUpdate({ width: spec.to.width });
        spec.onComplete();
        return { stop };
      },
    ),
  };
});

function setup(widthPx = 260) {
  const aside = document.createElement('aside');
  const rail = document.createElement('div');
  const asideRef =
    createRef<HTMLElement>() as React.RefObject<HTMLElement | null>;
  const railRef =
    createRef<HTMLElement>() as React.RefObject<HTMLElement | null>;
  asideRef.current = aside;
  railRef.current = rail;
  const setSidebarWidthPx = vi.fn();
  const view = renderHook(
    (props: { open: boolean; widthPx: number }) =>
      useNotesSidebarResize({
        asideRef,
        railRef,
        open: props.open,
        widthPx: props.widthPx,
        setSidebarWidthPx,
      }),
    { initialProps: { open: true, widthPx } },
  );
  return { ...view, aside, rail, setSidebarWidthPx };
}

/** A React pointer-down event, with the pointer-capture jsdom does not implement. */
function pointerDownEvent(clientX: number) {
  const target = document.createElement('div');
  target.setPointerCapture = vi.fn();
  target.releasePointerCapture = vi.fn();
  target.hasPointerCapture = vi.fn(() => true);
  return {
    clientX,
    pointerId: 1,
    currentTarget: target,
    preventDefault: vi.fn(),
  } as unknown as React.PointerEvent<HTMLDivElement>;
}

function drag(fromX: number, toX: number, hook: ReturnType<typeof setup>) {
  const event = pointerDownEvent(fromX);
  act(() => {
    hook.result.current.onResizePointerDown(event);
  });
  act(() => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: toX }));
  });
  return event;
}

beforeEach(() => {
  stop.mockClear();
});

afterEach(() => {
  document.body.style.removeProperty('user-select');
  document.body.style.removeProperty('cursor');
});

describe('useNotesSidebarResize', () => {
  it('ignores a drag while the sidebar is collapsed', () => {
    // Arrange
    const hook = setup();
    hook.rerender({ open: false, widthPx: 260 });
    const event = pointerDownEvent(100);

    // Act
    act(() => {
      hook.result.current.onResizePointerDown(event);
    });

    // Assert
    expect(hook.result.current.isResizingRef.current).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('captures the pointer and locks selection while dragging', () => {
    // Arrange
    const hook = setup();

    // Act
    const event = drag(100, 140, hook);

    // Assert
    expect(hook.result.current.isResizingRef.current).toBe(true);
    expect(event.currentTarget.setPointerCapture).toHaveBeenCalledWith(1);
    expect(document.body.style.userSelect).toBe('none');
    expect(document.body.style.cursor).toBe('col-resize');
  });

  it('widens the aside and the collapsed rail together as the pointer moves', () => {
    // Arrange
    const hook = setup(260);

    // Act
    drag(100, 160, hook);

    // Assert
    expect(hook.aside.style.width).toBe('320px');
    expect(hook.rail.style.width).toBe('320px');
  });

  it('commits the settled width once the pointer is released', () => {
    // Arrange
    const hook = setup(260);
    drag(100, 160, hook);

    // Act
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });

    // Assert — the persisted width and the painted width agree
    const committed = hook.setSidebarWidthPx.mock.calls.at(-1)?.[0] as number;
    expect(hook.result.current.isResizingRef.current).toBe(false);
    expect(hook.aside.style.width).toBe(`${String(committed)}px`);
    expect(hook.rail.style.width).toBe(`${String(committed)}px`);
    expect(document.body.style.userSelect).toBe('');
  });

  it('settles back inside the allowed range after an overshoot', () => {
    // Arrange
    const hook = setup(260);

    // Act — drag far past the maximum, then let go
    drag(100, 100 + NOTA_SIDEBAR_MAX_WIDTH_PX, hook);
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });

    // Assert
    const committed = hook.setSidebarWidthPx.mock.calls.at(-1)?.[0] as number;
    expect(committed).toBeLessThanOrEqual(NOTA_SIDEBAR_MAX_WIDTH_PX);
    expect(committed).toBeGreaterThanOrEqual(NOTA_SIDEBAR_MIN_WIDTH_PX);
  });

  it('treats a cancelled pointer like a release', () => {
    // Arrange
    const hook = setup(260);
    drag(100, 160, hook);

    // Act
    act(() => {
      window.dispatchEvent(new PointerEvent('pointercancel'));
    });

    // Assert
    expect(hook.result.current.isResizingRef.current).toBe(false);
    expect(hook.setSidebarWidthPx).toHaveBeenCalled();
  });

  it('interrupts a running settle when a new drag starts', () => {
    // Arrange
    const hook = setup(260);
    drag(100, 160, hook);
    act(() => {
      window.dispatchEvent(new PointerEvent('pointerup'));
    });

    // Act
    act(() => {
      hook.result.current.onResizePointerDown(pointerDownEvent(200));
    });

    // Assert
    expect(stop).toHaveBeenCalled();
  });

  it('ignores stray pointer moves when no drag is in flight', () => {
    // Arrange
    const hook = setup(260);

    // Act
    act(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 900 }));
    });

    // Assert
    expect(hook.aside.style.width).toBe('');
    expect(hook.setSidebarWidthPx).not.toHaveBeenCalled();
  });
});
