import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const pathname = { current: '/notes' };

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}));

const { useAppNavigationScreen } = await import('./use-app-navigation-screen');

describe('useAppNavigationScreen', () => {
  it('reads the active screen from the App Router pathname', () => {
    // Arrange
    pathname.current = '/notes/graph';

    // Act
    const { result } = renderHook(() => useAppNavigationScreen());

    // Assert
    expect(result.current).toEqual({
      kind: 'notes',
      panel: 'graph',
      noteId: null,
    });
  });

  it('follows a client navigation without any manual subscription', () => {
    // Arrange
    pathname.current = '/notes';
    const { result, rerender } = renderHook(() => useAppNavigationScreen());
    expect(result.current).toEqual({
      kind: 'notes',
      panel: 'list',
      noteId: null,
    });

    // Act — `usePathname` re-renders on pushState; the hook just re-derives
    pathname.current = '/notes/settings';
    rerender();

    // Assert
    expect(result.current).toMatchObject({ kind: 'notes', panel: 'settings' });
  });

  it('keeps the same screen value while the pathname is unchanged', () => {
    // Arrange
    pathname.current = '/notes/journal';
    const { result, rerender } = renderHook(() => useAppNavigationScreen());
    const first = result.current;

    // Act
    rerender();

    // Assert
    expect(result.current).toBe(first);
  });
});
