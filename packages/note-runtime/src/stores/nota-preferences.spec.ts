import { beforeEach, describe, expect, it } from 'vitest';
import { useNotaPreferencesStore } from './nota-preferences';

describe('nota preferences store cursor visual style', () => {
  beforeEach(() => {
    // Arrange
    try {
      globalThis.localStorage.removeItem('nota-preferences');
    } catch {
      // ignore
    }
    useNotaPreferencesStore.setState({
      openTodaysNoteShortcut: false,
      showNoteBacklinks: true,
      semanticSearchEnabled: true,
      emojiReplacerEnabled: true,
      cursorVisualStyle: 'line',
      preferencesPendingSync: false,
      lastServerUpdatedAt: null,
      dailyNoteIdByLocalDate: {},
    });
  });

  it('defaults cursor visual style to line', () => {
    // Arrange
    const state = useNotaPreferencesStore.getState();

    // Act
    const value = state.cursorVisualStyle;

    // Assert
    expect(value).toBe('line');
  });

  it('updates cursor visual style to block', () => {
    // Arrange
    const store = useNotaPreferencesStore.getState();

    // Act
    store.setCursorVisualStyle('block');

    // Assert
    expect(useNotaPreferencesStore.getState().cursorVisualStyle).toBe('block');
  });
});
