import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';

const submitUserPreferencesPatch = vi.fn();
const setUserPreferencesInState = vi.fn();
const navigatorLooksLikeApplePlatform = vi.fn(() => true);
const meta = {
  current: {
    notaProEntitled: true,
    userPreferences: { delete_empty_folders: true } as Record<
      string,
      unknown
    > | null,
  },
};
const user = {
  current: { id: 'user-1', email: 'ada@example.com' } as {
    id: string;
    email: string | null;
  } | null,
};

vi.mock('@clerk/react', () => ({
  UserButton: () => <div data-testid="user-button" />,
}));
vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({ user: user.current }),
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataMeta: () => meta.current,
  useNotesDataActions: () => ({ setUserPreferencesInState }),
}));
vi.mock('@getmadrid/note-runtime/use-sync-user-preferences', () => ({
  submitUserPreferencesPatch,
}));
vi.mock('@getmadrid/electron-bridge-ui/update-settings-section', () => ({
  ElectronUpdateSettingsSection: () => <div data-testid="electron-updates" />,
}));
vi.mock('@/components/nota-pro-settings-section', () => ({
  NotaProSettingsSection: () => <div data-testid="subscription" />,
}));
vi.mock('@/components/theme-menu', () => ({
  ThemeMenu: () => <div data-testid="theme-menu" />,
}));
vi.mock('@/lib/navigator-apple-platform', () => ({
  navigatorLooksLikeApplePlatform,
}));

const { default: NotesSettingsPage } = await import('./page');

beforeEach(() => {
  vi.clearAllMocks();
  navigatorLooksLikeApplePlatform.mockReturnValue(true);
  meta.current = {
    notaProEntitled: true,
    userPreferences: { delete_empty_folders: true },
  };
  user.current = { id: 'user-1', email: 'ada@example.com' };
  act(() => {
    useNotaPreferencesStore.setState({
      locale: null,
      openTodaysNoteShortcut: true,
      showNoteBacklinks: true,
      semanticSearchEnabled: true,
      emojiReplacerEnabled: true,
      cursorVisualStyle: 'line',
      showWritingActivityGraph: false,
    });
  });
});

afterEach(() => {
  delete (window as { nota?: unknown }).nota;
  vi.unstubAllGlobals();
});

describe('NotesSettingsPage appearance', () => {
  it('follows the device language until the reader picks one', () => {
    // Arrange|Act
    render(<NotesSettingsPage />);

    // Assert
    expect((screen.getByLabelText('Language') as HTMLSelectElement).value).toBe(
      'system',
    );
  });

  it('persists a chosen language, and clears it back to the device default', () => {
    // Arrange
    render(<NotesSettingsPage />);
    const select = screen.getByLabelText('Language');

    // Act
    fireEvent.change(select, { target: { value: 'es-ES' } });

    // Assert
    expect(useNotaPreferencesStore.getState().locale).toBe('es-ES');
    expect(submitUserPreferencesPatch).toHaveBeenCalledWith(
      { locale: 'es-ES' },
      'user-1',
      setUserPreferencesInState,
      true,
    );

    // Act
    fireEvent.change(select, { target: { value: 'system' } });

    // Assert — "system" is stored as absent, not as a locale
    expect(submitUserPreferencesPatch).toHaveBeenLastCalledWith(
      { locale: null },
      'user-1',
      setUserPreferencesInState,
      true,
    );
  });

  it('switches the editor cursor style', () => {
    // Arrange
    render(<NotesSettingsPage />);

    // Act
    fireEvent.click(screen.getByLabelText(/Block/));

    // Assert
    expect(useNotaPreferencesStore.getState().cursorVisualStyle).toBe('block');
  });
});

describe('NotesSettingsPage shortcuts', () => {
  it('spells the modifier for the reader’s hardware', () => {
    // Arrange|Act
    render(<NotesSettingsPage />);

    // Assert
    expect(screen.getByText(/⌘D/)).toBeTruthy();
    expect(screen.getByText(/⌘\[ and ⌘\]/)).toBeTruthy();
  });

  it('spells the modifier as Ctrl elsewhere', () => {
    // Arrange
    navigatorLooksLikeApplePlatform.mockReturnValue(false);
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    // Act
    render(<NotesSettingsPage />);

    // Assert
    expect(screen.getByText(/Ctrl\+D/)).toBeTruthy();
  });

  it('persists the daily-note shortcut toggle', () => {
    // Arrange
    render(<NotesSettingsPage />);

    // Act
    fireEvent.click(screen.getByLabelText(/Open today's note/));

    // Assert
    expect(useNotaPreferencesStore.getState().openTodaysNoteShortcut).toBe(
      false,
    );
    expect(submitUserPreferencesPatch).toHaveBeenCalledWith(
      { open_todays_note_shortcut: false },
      'user-1',
      setUserPreferencesInState,
      true,
    );
  });

  it('links to the full keyboard reference', () => {
    // Arrange|Act
    render(<NotesSettingsPage />);

    // Assert
    expect(
      screen
        .getByRole('link', { name: 'View all shortcuts' })
        .getAttribute('href'),
    ).toBe('/notes/shortcuts');
  });
});

describe('NotesSettingsPage note preferences', () => {
  it('persists the backlinks and emoji toggles', () => {
    // Arrange
    render(<NotesSettingsPage />);

    // Act
    fireEvent.click(screen.getByLabelText(/Show backlinks/));
    fireEvent.click(screen.getByLabelText(/Replace typed smileys/));

    // Assert
    expect(submitUserPreferencesPatch).toHaveBeenCalledWith(
      { show_note_backlinks: false },
      'user-1',
      setUserPreferencesInState,
      true,
    );
    expect(submitUserPreferencesPatch).toHaveBeenCalledWith(
      { emoji_replacer_enabled: false },
      'user-1',
      setUserPreferencesInState,
      true,
    );
  });

  it('treats folder pruning as on unless it was explicitly turned off', () => {
    // Arrange
    meta.current = { notaProEntitled: true, userPreferences: null };

    // Act
    render(<NotesSettingsPage />);

    // Assert
    expect(
      (
        screen.getByLabelText(
          /Delete folder when it has no notes/,
        ) as HTMLInputElement
      ).checked,
    ).toBe(true);
  });
});

describe('NotesSettingsPage gated sections', () => {
  it('puts the account and plan before preferences for unpaid readers', () => {
    // Arrange
    meta.current = {
      notaProEntitled: false,
      userPreferences: { delete_empty_folders: true },
    };

    // Act
    render(<NotesSettingsPage />);

    // Assert
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(
      headings.findIndex((heading) => heading.textContent === 'Account'),
    ).toBeLessThan(
      headings.findIndex((heading) => heading.textContent === 'General'),
    );
  });

  it('puts preferences before the account for active subscribers', () => {
    // Arrange|Act
    render(<NotesSettingsPage />);

    // Assert
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(
      headings.findIndex((heading) => heading.textContent === 'General'),
    ).toBeLessThan(
      headings.findIndex((heading) => heading.textContent === 'Account'),
    );
  });

  it('offers semantic search and the activity graph only with Madrid Pro', () => {
    // Arrange|Act
    const { unmount } = render(<NotesSettingsPage />);

    // Assert
    expect(screen.getByLabelText(/Enable Semantic Search/)).toBeTruthy();
    expect(screen.getByText(/Show writing activity graph/)).toBeTruthy();

    // Arrange
    unmount();
    meta.current = {
      notaProEntitled: false,
      userPreferences: { delete_empty_folders: true },
    };

    // Act
    render(<NotesSettingsPage />);

    // Assert
    expect(screen.queryByLabelText(/Enable Semantic Search/)).toBeNull();
    expect(screen.queryByText(/Show writing activity graph/)).toBeNull();
  });

  it('always offers the subscription panel to a signed-in reader', () => {
    // Arrange
    meta.current = {
      notaProEntitled: false,
      userPreferences: { delete_empty_folders: true },
    };

    // Act
    render(<NotesSettingsPage />);

    // Assert — this is where an unsubscribed reader goes to subscribe
    expect(screen.getByTestId('subscription')).toBeTruthy();
  });

  it('shows the desktop update section only in Electron', () => {
    // Arrange
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Safari/605' });
    const { unmount } = render(<NotesSettingsPage />);

    // Assert
    expect(screen.queryByTestId('electron-updates')).toBeNull();

    // Arrange
    unmount();
    (window as { nota?: unknown }).nota = {};

    // Act
    render(<NotesSettingsPage />);

    // Assert
    expect(screen.getByTestId('electron-updates')).toBeTruthy();
  });

  it('names the signed-in account', () => {
    // Arrange|Act
    render(<NotesSettingsPage />);

    // Assert
    expect(screen.getByText('ada@example.com')).toBeTruthy();
    expect(screen.getByTestId('user-button')).toBeTruthy();
  });

  it('hides the account section when there is no session', () => {
    // Arrange
    user.current = null;

    // Act
    render(<NotesSettingsPage />);

    // Assert
    expect(screen.queryByTestId('user-button')).toBeNull();
    expect(screen.queryByTestId('subscription')).toBeNull();
  });
});
