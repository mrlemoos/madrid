import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

type Listener = () => void;

function stubMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const mq = {
    matches: initial,
    addEventListener: (_: string, fn: Listener) => listeners.add(fn),
    removeEventListener: (_: string, fn: Listener) => listeners.delete(fn),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mq),
  );
  return {
    mq,
    /** Flip the OS setting the way the media query would. */
    change(next: boolean) {
      mq.matches = next;
      for (const fn of listeners) fn();
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePrefersReducedMotion', () => {
  it('starts false so the server render and first paint agree', () => {
    // Arrange
    stubMatchMedia(true);

    // Act
    const { result } = renderHook(() => usePrefersReducedMotion());

    // Assert — it settles to true on the effect, never mid-hydration
    expect(result.current).toBe(true);
  });

  it('reads the current setting on mount', () => {
    // Arrange
    stubMatchMedia(false);

    // Act
    const { result } = renderHook(() => usePrefersReducedMotion());

    // Assert
    expect(result.current).toBe(false);
  });

  it('follows the setting when the reader changes it mid-session', () => {
    // Arrange
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());

    // Act
    act(() => {
      media.change(true);
    });

    // Assert
    expect(result.current).toBe(true);
  });

  it('detaches its listener on unmount', () => {
    // Arrange
    const media = stubMatchMedia(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());

    // Act
    unmount();

    // Assert
    expect(media.listenerCount()).toBe(0);
  });
});
