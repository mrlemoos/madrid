import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesShell, type NotesShellRouteComponents } from './notes-shell.js';
import { NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT } from '@nota/electron-bridge-core/menubar-events';
import { useNotesData } from '@nota/note-runtime/notes-data-context';

const notesShellTestCtx = vi.hoisted(() => {
  const longTitle = 'Study note: 15 April 2026: '.padEnd(120, 'x');
  const listNote = {
    id: 'note-1',
    user_id: 'user-1',
    title: longTitle,
    content: {},
    created_at: '2026-04-15T12:00:00.000Z',
    updated_at: '2026-04-15T12:00:00.000Z',
    due_at: null,
    is_deadline: false,
    editor_settings: {},
    banner_attachment_id: null,
    folder_id: null,
    share_token: null,
  };
  return {
    longTitle,
    vaultLoading: false,
    listNote,
  };
});

function NoopRoute(): null {
  return null;
}

const testRoutes: NotesShellRouteComponents = {
  NotesGraphRoute: NoopRoute,
  NotesJournalRoute: NoopRoute,
  NotesSettingsRoute: NoopRoute,
  NotesShortcutsRoute: NoopRoute,
};

function renderNotesShell(): ReturnType<typeof render> {
  return render(<NotesShell routes={testRoutes} />);
}

vi.mock('@nota/electron-bridge-ui/menubar-bridge', () => ({
  ElectronMenubarBridge: (): null => null,
}));

vi.mock('@nota/note-capture-ui/audio-to-note-dock', () => ({
  AudioToNoteDock: (): null => null,
}));

vi.mock('@nota/note-capture-ui/study-recording-upload-warning-banner', () => ({
  StudyRecordingUploadWarningBanner: (): null => null,
}));

vi.mock('@nota/app-navigation-ui/use-app-navigation-screen', () => ({
  useAppNavigationScreen: () => ({
    kind: 'notes',
    panel: 'list',
    noteId: null,
  }),
}));

vi.mock('@nota/note-runtime/notes-data-context', () => ({
  useNotesData: vi.fn(),
}));

const sidebarStoreState = vi.hoisted(() => ({
  open: true,
  setOpen: vi.fn(),
  toggle: vi.fn(),
  widthPx: 288,
  setSidebarWidthPx: vi.fn(),
  collapsedFolderIds: [] as string[],
  toggleFolderCollapsed: vi.fn(),
  expandFolder: vi.fn(),
  expandFolderAncestors: vi.fn(),
  pruneCollapsedFolderIds: vi.fn(),
}));

const gsapTo = vi.hoisted(() => vi.fn());
const gsapSet = vi.hoisted(() => vi.fn());

vi.mock('@nota/nota-motion-ui/motion', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@nota/nota-motion-ui/motion')>();
  return {
    ...actual,
    gsap: {
      ...actual.gsap,
      to: gsapTo,
      set: (...args: Parameters<typeof actual.gsap.set>) => {
        gsapSet(...args);
        return actual.gsap.set(...args);
      },
    },
  };
});

vi.mock('@nota/note-runtime/stores/sidebar', () => ({
  useNotesSidebarStore: <T,>(selector?: (s: typeof sidebarStoreState) => T) =>
    selector
      ? selector(sidebarStoreState)
      : (sidebarStoreState as unknown as T),
}));

vi.mock('@nota/note-runtime/sticky-doc-title', () => ({
  useStickyDocTitle: () => ({
    registerScrollRoot: vi.fn(),
    resetSticky: vi.fn(),
    sticky: { visible: false, label: null },
  }),
}));

vi.mock('@nota/electron-bridge-ui/use-is-electron', () => ({
  useIsElectron: () => false,
}));

vi.mock('@nota/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('@nota/note-runtime/stores/preferences', () => ({
  useNotaPreferencesStore: <T,>(
    selector: (s: {
      openTodaysNoteShortcut: boolean;
      showWritingActivityGraph: boolean;
      writingActivityColor: 'blue';
      writingActivityDays: Record<string, number>;
    }) => T,
  ): T =>
    selector({
      openTodaysNoteShortcut: false,
      showWritingActivityGraph: false,
      writingActivityColor: 'blue',
      writingActivityDays: {},
    }),
}));

vi.mock('@nota/note-runtime/use-sync-user-preferences', () => ({
  useSyncUserPreferences: (): void => {},
}));

vi.mock('@nota/app-navigation-ui/use-notes-history-shortcut', () => ({
  useNotesHistoryShortcut: (): void => {},
}));

vi.mock('@nota/app-navigation-ui/use-notes-sidebar-shortcut', () => ({
  useNotesSidebarShortcut: (): void => {},
}));

vi.mock('@nota/app-navigation-ui/use-settings-shortcut', () => ({
  useSettingsShortcut: (): void => {},
}));

vi.mock('@nota/app-navigation-ui/use-todays-note-shortcut', () => ({
  useTodaysNoteShortcut: (): void => {},
}));

vi.mock('@nota/note-runtime/use-notes-offline-sync', () => ({
  useNotesOfflineSync: (): void => {},
}));

vi.mock('@nota/note-capture-ui/use-audio-note-pending-drain', () => ({
  useAudioNotePendingDrain: (): void => {},
}));

describe('NotesShell', () => {
  beforeEach(() => {
    sidebarStoreState.open = true;
    gsapTo.mockClear();
    gsapSet.mockClear();
    vi.mocked(useNotesData).mockImplementation(() => ({
      notes: [notesShellTestCtx.listNote],
      folders: [],
      loadError: undefined,
      userPreferences: null,
      notaProEntitled: true,
      loading: notesShellTestCtx.vaultLoading,
      refreshNotesList: vi.fn(),
      insertNoteAtFront: vi.fn(),
      insertFolderSorted: vi.fn(),
      patchNoteInList: vi.fn(),
      removeNoteFromList: vi.fn(),
      removeFolderFromList: vi.fn(),
      setUserPreferencesInState: vi.fn(),
      patchFolderInList: vi.fn(),
    }));
  });

  afterEach(() => {
    notesShellTestCtx.vaultLoading = false;
  });

  it('fixes the notes sidebar width on first paint so long titles do not expand the column', () => {
    // Arrange
    const navigationHash = '#/notes';
    window.history.replaceState(null, '', navigationHash);

    // Act
    const { container } = renderNotesShell();

    // Assert
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.style.width).toBe('288px');
    expect(screen.getByText(notesShellTestCtx.longTitle)).toBeTruthy();
  });

  it('applies the stored sidebar width when vault loading finishes and the aside mounts', () => {
    // Arrange
    notesShellTestCtx.vaultLoading = true;
    window.history.replaceState(null, '', '#/notes');
    const { container, rerender } = renderNotesShell();
    expect(container.querySelector('aside')).toBeNull();

    // Act
    notesShellTestCtx.vaultLoading = false;
    rerender(<NotesShell routes={testRoutes} />);

    // Assert
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.style.width).toBe('288px');
  });

  it('renders a vertical resize handle when the sidebar is open', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');

    // Act
    const { container } = renderNotesShell();

    // Assert
    expect(
      container.querySelector(
        '[role="separator"][aria-orientation="vertical"]',
      ),
    ).not.toBeNull();
  });

  it('opens the new folder dialog from the menubar request event', async () => {
    // Arrange
    renderNotesShell();

    // Act
    act(() => {
      window.dispatchEvent(new Event(NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT));
    });

    // Assert
    expect(await screen.findByText('New folder')).toBeTruthy();
  });

  it('shows a loading status and hides vault chrome while the initial vault fetch runs', () => {
    // Arrange
    notesShellTestCtx.vaultLoading = true;
    window.history.replaceState(null, '', '#/notes');

    // Act
    const { container } = renderNotesShell();

    // Assert
    expect(screen.getByText(/loading notes/i)).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(notesShellTestCtx.longTitle)).toBeNull();
    expect(container.querySelector('aside')).toBeNull();
  });

  it('does not render a header plus button to create notes', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');

    // Act
    renderNotesShell();

    // Assert
    expect(screen.queryByLabelText('Create new note')).toBeNull();
  });

  it('does not render a Notes heading at the top of the sidebar', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');

    // Act
    renderNotesShell();

    // Assert
    expect(screen.queryByRole('heading', { name: 'Notes' })).toBeNull();
  });

  it('calls the injected prefetchRoutes callback once on mount', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');
    const prefetchRoutes = vi.fn();

    // Act
    render(<NotesShell routes={testRoutes} prefetchRoutes={prefetchRoutes} />);

    // Assert
    expect(prefetchRoutes).toHaveBeenCalledTimes(1);
  });
});
