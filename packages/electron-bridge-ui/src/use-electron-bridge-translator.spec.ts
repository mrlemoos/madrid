import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';

import { useElectronBridgeTranslator } from './use-electron-bridge-translator';

afterEach(() => {
  act(() => {
    useNotaPreferencesStore.setState({ locale: null });
  });
});

describe('useElectronBridgeTranslator', () => {
  it('translates through the locale the reader picked', () => {
    // Arrange
    act(() => {
      useNotaPreferencesStore.setState({ locale: 'es-ES' });
    });

    // Act
    const { result } = renderHook(() => useElectronBridgeTranslator());

    // Assert
    expect(result.current.locale).toBe('es-ES');
    expect(result.current.t('Settings')).not.toBe('Settings');
  });

  it('leaves British English keys untouched', () => {
    // Arrange
    act(() => {
      useNotaPreferencesStore.setState({ locale: 'en-GB' });
    });

    // Act
    const { result } = renderHook(() => useElectronBridgeTranslator());

    // Assert
    expect(result.current.locale).toBe('en-GB');
    expect(result.current.t('Settings')).toBe('Settings');
  });

  it('keeps the same translator until the locale changes', () => {
    // Arrange
    act(() => {
      useNotaPreferencesStore.setState({ locale: 'en-GB' });
    });
    const { result, rerender } = renderHook(() =>
      useElectronBridgeTranslator(),
    );
    const first = result.current.t;

    // Act
    rerender();
    const afterRerender = result.current.t;
    act(() => {
      useNotaPreferencesStore.setState({ locale: 'pt-BR' });
    });

    // Assert
    expect(afterRerender).toBe(first);
    expect(result.current.t).not.toBe(first);
    expect(result.current.locale).toBe('pt-BR');
  });
});
