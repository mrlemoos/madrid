import { render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';

const navigatorLooksLikeApplePlatform = vi.fn(() => true);

vi.mock('@/lib/navigator-apple-platform', () => ({
  navigatorLooksLikeApplePlatform,
}));

const { default: NotesShortcutsPage } = await import('./page');

beforeEach(() => {
  vi.clearAllMocks();
  navigatorLooksLikeApplePlatform.mockReturnValue(true);
  act(() => {
    useNotaPreferencesStore.setState({ openTodaysNoteShortcut: true });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NotesShortcutsPage', () => {
  it('lists the shortcut sections', () => {
    // Arrange|Act
    render(<NotesShortcutsPage />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Shortcuts' })).toBeTruthy();
    expect(screen.getAllByRole('list').length).toBeGreaterThan(0);
  });

  it('spells Mod as the Command key on Apple hardware', () => {
    // Arrange|Act
    render(<NotesShortcutsPage />);

    // Assert
    expect(screen.getByText(/⌘ on your device/)).toBeTruthy();
  });

  it('spells Mod as Ctrl elsewhere', () => {
    // Arrange
    navigatorLooksLikeApplePlatform.mockReturnValue(false);
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    // Act
    render(<NotesShortcutsPage />);

    // Assert
    expect(screen.getByText(/Ctrl on your device/)).toBeTruthy();
  });

  it('hides the daily-note shortcut when the reader turned it off', () => {
    // Arrange
    const { unmount } = render(<NotesShortcutsPage />);
    const withShortcut = within(document.body).queryAllByRole(
      'listitem',
    ).length;
    unmount();

    // Act
    act(() => {
      useNotaPreferencesStore.setState({ openTodaysNoteShortcut: false });
    });
    render(<NotesShortcutsPage />);

    // Assert
    expect(screen.getAllByRole('listitem').length).toBeLessThan(withShortcut);
  });
});
