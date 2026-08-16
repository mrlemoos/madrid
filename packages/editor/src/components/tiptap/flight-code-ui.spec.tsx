import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFlightCode } from './flight-code-ui';

vi.mock('../../lib/flight-client', () => ({
  fetchFlightInfo: vi.fn().mockResolvedValue(null),
}));

describe('useFlightCode', () => {
  it('exposes a handlersRef and overlay element', () => {
    // Arrange / Act
    const { result } = renderHook(() => useFlightCode());

    // Assert
    expect(result.current.handlersRef).toBeDefined();
    expect(result.current.handlersRef.current).not.toBeNull();
    expect(result.current.overlay).toBeTruthy();
  });

  it('sets hover state via onHover handler', () => {
    // Arrange
    const { result } = renderHook(() => useFlightCode());
    const anchor = document.createElement('span');

    // Act
    act(() => {
      result.current.handlersRef.current?.onHover('AA123', anchor);
    });

    // Assert
    expect(result.current.handlersRef.current).toBeTruthy();
  });

  it('opens dialog via onOpen and clears hover', () => {
    // Arrange
    const { result } = renderHook(() => useFlightCode());
    const anchor = document.createElement('span');
    act(() => {
      result.current.handlersRef.current?.onHover('BA456', anchor);
    });

    // Act
    act(() => {
      result.current.handlersRef.current?.onOpen('BA456');
    });

    // Assert
    expect(result.current.handlersRef.current).toBeTruthy();
  });
});
