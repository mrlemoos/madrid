import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isElectronShellSync, useIsElectron } from './use-is-electron';

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as { nota?: unknown }).nota;
});

describe('isElectronShellSync', () => {
  it('recognises the shell by its preload bridge', () => {
    // Arrange
    (window as { nota?: unknown }).nota = {};

    // Act|Assert
    expect(isElectronShellSync()).toBe(true);
  });

  it('recognises the shell by its user agent', () => {
    // Arrange
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Electron/38.0.0' });

    // Act|Assert
    expect(isElectronShellSync()).toBe(true);
  });

  it('is false in an ordinary browser', () => {
    // Arrange
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Safari/605' });

    // Act|Assert
    expect(isElectronShellSync()).toBe(false);
  });
});

describe('useIsElectron', () => {
  it('reports the shell before paint, so the web-only chrome never flashes', () => {
    // Arrange
    (window as { nota?: unknown }).nota = {};

    // Act — the layout effect has already run by the time renderHook returns
    const { result } = renderHook(() => useIsElectron());

    // Assert
    expect(result.current).toBe(true);
  });

  it('stays false in the browser', () => {
    // Arrange
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Safari/605' });

    // Act
    const { result } = renderHook(() => useIsElectron());

    // Assert
    expect(result.current).toBe(false);
  });
});
