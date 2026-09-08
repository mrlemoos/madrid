import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { StickyDocTitleProvider, useStickyDocTitle } from './sticky-doc-title';

function wrapper({ children }: { children: ReactNode }) {
  return <StickyDocTitleProvider>{children}</StickyDocTitleProvider>;
}

describe('useStickyDocTitle without a provider', () => {
  it('returns an inert fallback instead of throwing', () => {
    // Arrange|Act — route stubs in tests render without the provider
    const { result } = renderHook(() => useStickyDocTitle());

    // Assert
    expect(result.current.sticky).toEqual({ visible: false, label: '' });
    expect(() => {
      result.current.setSticky({ visible: true });
      result.current.resetSticky();
      result.current.registerScrollRoot(null);
    }).not.toThrow();
    expect(result.current.sticky.visible).toBe(false);
  });
});

describe('StickyDocTitleProvider', () => {
  it('renders its children', () => {
    // Arrange|Act
    render(
      <StickyDocTitleProvider>
        <span>note</span>
      </StickyDocTitleProvider>,
    );

    // Assert
    expect(screen.getByText('note')).toBeTruthy();
  });

  it('starts hidden with no label', () => {
    // Arrange|Act
    const { result } = renderHook(() => useStickyDocTitle(), { wrapper });

    // Assert
    expect(result.current.sticky).toEqual({ visible: false, label: '' });
  });

  it('merges a partial update into the sticky state', () => {
    // Arrange
    const { result } = renderHook(() => useStickyDocTitle(), { wrapper });
    act(() => {
      result.current.setSticky({ label: 'Boarding pass' });
    });

    // Act
    act(() => {
      result.current.setSticky({ visible: true });
    });

    // Assert
    expect(result.current.sticky).toEqual({
      visible: true,
      label: 'Boarding pass',
    });
  });

  it('resets back to hidden and unlabelled', () => {
    // Arrange
    const { result } = renderHook(() => useStickyDocTitle(), { wrapper });
    act(() => {
      result.current.setSticky({ visible: true, label: 'Boarding pass' });
    });

    // Act
    act(() => {
      result.current.resetSticky();
    });

    // Assert
    expect(result.current.sticky).toEqual({ visible: false, label: '' });
  });

  it('publishes the registered scroll root and bumps the epoch', () => {
    // Arrange
    const { result } = renderHook(() => useStickyDocTitle(), { wrapper });
    const before = result.current.scrollRootEpoch;
    const el = document.createElement('main');

    // Act
    act(() => {
      result.current.registerScrollRoot(el);
    });

    // Assert — observers re-attach on the epoch, since a ref alone does not re-render
    expect(result.current.scrollRootRef.current).toBe(el);
    expect(result.current.scrollRootEpoch).toBe(before + 1);
  });

  it('bumps the epoch again when the scroll root goes away', () => {
    // Arrange
    const { result } = renderHook(() => useStickyDocTitle(), { wrapper });
    act(() => {
      result.current.registerScrollRoot(document.createElement('main'));
    });
    const afterRegister = result.current.scrollRootEpoch;

    // Act
    act(() => {
      result.current.registerScrollRoot(null);
    });

    // Assert
    expect(result.current.scrollRootRef.current).toBeNull();
    expect(result.current.scrollRootEpoch).toBe(afterRegister + 1);
  });
});
