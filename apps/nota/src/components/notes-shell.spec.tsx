import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesShell } from './notes-shell';
import { NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT } from '../lib/electron-menubar-events';
import { useNotesData } from '../context/notes-data-context';

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
  };
  return {
    longTitle,
    vaultLoading: false,
    listNote,
  };
});

vi.mock('./electron-menubar-bridge', () => ({
  ElectronMenubarBridge: (): null => null,
}));

vi.mock('./audio-to-note-dock', () => ({
  AudioToNoteDock: (): null => null,
}));

vi.mock('./study-recording-upload-warning-banner', () => ({
  StudyRecordingUploadWarningBanner: (): null => null,
}));

vi.mock('../hooks/use-app-navigation-screen', () => ({
  useAppNavigationScreen: () => ({
    kind: 'notes',
    panel: 'list',
    noteId: null,
  }),
}));

vi.mock('../context/notes-data-context', () => ({
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

vi.mock('@/lib/nota-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/nota-motion')>();
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

vi.mock('../stores/notes-sidebar', () => ({
  useNotesSidebarStore: <T,>(selector?: (s: typeof sidebarStoreState) => T) =>
    selector
      ? selector(sidebarStoreState)
      : (sidebarStoreState as unknown as T),
}));

vi.mock('../context/sticky-doc-title', () => ({
  useStickyDocTitle: () => ({
    registerScrollRoot: vi.fn(),
    resetSticky: vi.fn(),
    sticky: { visible: false, label: null },
  }),
}));

vi.mock('../lib/use-is-electron', () => ({
  useIsElectron: () => false,
}));

vi.mock('../context/session-context', () => ({
  useRootLoaderData: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('../stores/nota-preferences', () => ({
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

vi.mock('../lib/use-sync-user-preferences', () => ({
  useSyncUserPreferences: (): void => {},
}));

vi.mock('../lib/use-notes-history-shortcut', () => ({
  useNotesHistoryShortcut: (): void => {},
}));

vi.mock('../lib/use-notes-sidebar-shortcut', () => ({
  useNotesSidebarShortcut: (): void => {},
}));

vi.mock('../lib/use-settings-shortcut', () => ({
  useSettingsShortcut: (): void => {},
}));

vi.mock('../lib/use-todays-note-shortcut', () => ({
  useTodaysNoteShortcut: (): void => {},
}));

vi.mock('../lib/use-notes-offline-sync', () => ({
  useNotesOfflineSync: (): void => {},
}));

vi.mock('../hooks/use-audio-note-pending-drain', () => ({
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
    const { container } = render(<NotesShell />);

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
    const { container, rerender } = render(<NotesShell />);
    expect(container.querySelector('aside')).toBeNull();

    // Act
    notesShellTestCtx.vaultLoading = false;
    rerender(<NotesShell />);

    // Assert
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside?.style.width).toBe('288px');
  });

  it('renders a vertical resize handle when the sidebar is open', () => {
    // Arrange
    window.history.replaceState(null, '', '#/notes');

    // Act
    const { container } = render(<NotesShell />);

    // Assert
    expect(
      container.querySelector(
        '[role="separator"][aria-orientation="vertical"]',
      ),
    ).not.toBeNull();
  });

  it('opens the new folder dialog from the menubar request event', async () => {
    // Arrange
    render(<NotesShell />);

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
    const { container } = render(<NotesShell />);

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
    render(<NotesShell />);

    // Assert
    expect(screen.queryByLabelText('Create new note')).toBeNull();
  });
});
