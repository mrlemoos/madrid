import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesChrome } from './notes-chrome';
import { NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT } from '@getmadrid/electron-bridge-core/menubar-events';
import { useNotesData } from '@getmadrid/note-runtime/notes-data-context';

const notesChromeTestCtx = vi.hoisted(() => {
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

const PANEL_CHILD_TEST_ID = 'nota-panel-child';

function renderNotesChrome(): ReturnType<typeof render> {
  return render(
    <NotesChrome>
      <div data-testid={PANEL_CHILD_TEST_ID} />
    </NotesChrome>,
  );
}

vi.mock('@getmadrid/electron-bridge-ui/menubar-bridge', () => ({
  ElectronMenubarBridge: (): null => null,
}));

vi.mock('@getmadrid/note-capture-ui/audio-to-note-dock', () => ({
  AudioToNoteDock: (): null => null,
}));

vi.mock(
  '@getmadrid/note-capture-ui/study-recording-upload-warning-banner',
  () => ({
    StudyRecordingUploadWarningBanner: (): null => null,
  }),
);

vi.mock('@getmadrid/app-navigation-ui/use-app-navigation-screen', () => ({
  useAppNavigationScreen: () => ({
    kind: 'notes',
    panel: 'list',
    noteId: null,
  }),
}));

vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
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

vi.mock('@getmadrid/nota-motion-ui/motion', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@getmadrid/nota-motion-ui/motion')>();
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

vi.mock('@getmadrid/note-runtime/stores/sidebar', () => ({
  useNotesSidebarStore: <T,>(selector?: (s: typeof sidebarStoreState) => T) =>
    selector
      ? selector(sidebarStoreState)
      : (sidebarStoreState as unknown as T),
}));

vi.mock('@getmadrid/note-runtime/sticky-doc-title', () => ({
  useStickyDocTitle: () => ({
    registerScrollRoot: vi.fn(),
    resetSticky: vi.fn(),
    sticky: { visible: false, label: null },
  }),
}));

vi.mock('@getmadrid/electron-bridge-ui/use-is-electron', () => ({
  useIsElectron: () => false,
}));

vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('@getmadrid/note-runtime/stores/preferences', () => ({
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

vi.mock('@getmadrid/note-runtime/use-sync-user-preferences', () => ({
  useSyncUserPreferences: (): void => {},
  useSyncClerkDisplayName: (): void => {},
}));

vi.mock('@getmadrid/app-navigation-ui/use-notes-history-shortcut', () => ({
  useNotesHistoryShortcut: (): void => {},
}));

vi.mock('@getmadrid/app-navigation-ui/use-notes-sidebar-shortcut', () => ({
  useNotesSidebarShortcut: (): void => {},
}));

vi.mock('@getmadrid/app-navigation-ui/use-settings-shortcut', () => ({
  useSettingsShortcut: (): void => {},
}));

vi.mock('@getmadrid/app-navigation-ui/use-todays-note-shortcut', () => ({
  useTodaysNoteShortcut: (): void => {},
}));

vi.mock('@getmadrid/note-runtime/use-notes-offline-sync', () => ({
  useNotesOfflineSync: (): void => {},
}));

vi.mock('@getmadrid/note-capture-ui/use-audio-note-pending-drain', () => ({
  useAudioNotePendingDrain: (): void => {},
}));

describe('NotesChrome', () => {
  beforeEach(() => {
    sidebarStoreState.open = true;
    gsapTo.mockClear();
    gsapSet.mockClear();
    vi.mocked(useNotesData).mockImplementation(() => ({
      notes: [notesChromeTestCtx.listNote],
      folders: [],
      loadError: undefined,
      userPreferences: null,
      notaProEntitled: true,
      loading: notesChromeTestCtx.vaultLoading,
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
    notesChromeTestCtx.vaultLoading = false;
  });

  it('fixes the notes sidebar width on first paint so long titles do not expand the column', () => {
    // Arrange
    const navigationHash = '#/notes';
    window.history.replaceState(null, '', navigationHash);

    // Act
    const { container } = renderNotesChrome();

    // Assert
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.style.width).toBe('288px');
    expect(screen.getByText(notesChromeTestCtx.longTitle)).toBeTruthy();
  });

  it('applies the stored sidebar width when vault loading finishes and the aside mounts', () => {
    // Arrange
    notesChromeTestCtx.vaultLoading = true;
    window.history.replaceState(null, '', '#/notes');
    const { container, rerender } = renderNotesChrome();
    expect(container.querySelector('aside')).toBeNull();

    // Act
    notesChromeTestCtx.vaultLoading = false;
    rerender(
      <NotesChrome>
        <div data-testid={PANEL_CHILD_TEST_ID} />
      </NotesChrome>,
    );

    // Assert
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.style.width).toBe('288px');
  });

  it('renders a vertical resize handle when the sidebar is open', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');

    // Act
    const { container } = renderNotesChrome();

    // Assert
    expect(
      container.querySelector(
        '[role="separator"][aria-orientation="vertical"]',
      ),
    ).not.toBeNull();
  });

  it('opens the new folder dialog from the menubar request event', async () => {
    // Arrange
    renderNotesChrome();

    // Act
    act(() => {
      window.dispatchEvent(new Event(NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT));
    });

    // Assert
    expect(await screen.findByText('New folder')).toBeTruthy();
  });

  it('shows a loading status and hides vault chrome while the initial vault fetch runs', () => {
    // Arrange
    notesChromeTestCtx.vaultLoading = true;
    window.history.replaceState(null, '', '#/notes');

    // Act
    const { container } = renderNotesChrome();

    // Assert
    expect(screen.getByText(/loading notes/i)).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(notesChromeTestCtx.longTitle)).toBeNull();
    expect(container.querySelector('aside')).toBeNull();
  });

  it('does not render a header plus button to create notes', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');

    // Act
    renderNotesChrome();

    // Assert
    expect(screen.queryByLabelText('Create new note')).toBeNull();
  });

  it('does not render a Notes heading at the top of the sidebar', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');

    // Act
    renderNotesChrome();

    // Assert
    expect(screen.queryByRole('heading', { name: 'Notes' })).toBeNull();
  });

  it('renders the active panel route as children in the main area', () => {
    // Arrange
    window.history.replaceState(null, '', '/notes');

    // Act
    renderNotesChrome();

    // Assert
    expect(screen.getByTestId(PANEL_CHILD_TEST_ID)).toBeTruthy();
  });
});
