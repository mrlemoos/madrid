import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './command-palette';
import { ThemeProvider } from '@nota/web-design/theme';
import { dispatchRenameFolderRequest } from '@nota/note-folders-ui/folder-rename-request';
import { NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT } from '@nota/electron-bridge-core/menubar-events';
import { clientUpdateFolderTint } from '@nota/note-folders-ui/update-folder-tint-client';

vi.mock('@nota/note-folders-ui/update-folder-tint-client', () => ({
  clientUpdateFolderTint: vi.fn(() => Promise.resolve()),
}));

vi.mock('@nota/note-folders-ui/folder-rename-request', () => ({
  dispatchRenameFolderRequest: vi.fn(),
}));

vi.mock('@nota/note-runtime/notes-data-context', () => ({
  useNotesData: () => ({
    notes: [
      {
        id: 'note-1',
        user_id: 'user-1',
        title: 'Alpha note',
        content: {},
        created_at: '2026-04-15T12:00:00.000Z',
        updated_at: '2026-04-15T12:00:00.000Z',
        due_at: null,
        is_deadline: false,
        editor_settings: {},
        banner_attachment_id: null,
        folder_id: null,
      },
    ],
    folders: [
      {
        id: 'folder-1',
        user_id: 'user-1',
        name: 'Computer Science Study',
        parent_id: null,
        tint: null,
        created_at: '2026-04-25T00:00:00.000Z',
        updated_at: '2026-04-25T00:00:00.000Z',
      },
    ],
    notaProEntitled: true,
    userPreferences: null,
    refreshNotesList: vi.fn(),
    insertNoteAtFront: vi.fn(),
    insertFolderSorted: vi.fn(),
    patchNoteInList: vi.fn(),
    removeNoteFromList: vi.fn(),
    removeFolderFromList: vi.fn(),
    patchFolderInList: vi.fn(),
  }),
}));

vi.mock('@nota/app-navigation-ui/use-app-navigation-screen', () => ({
  useAppNavigationScreen: () => ({
    kind: 'notes',
    panel: 'list',
    noteId: null,
  }),
}));

vi.mock('@nota/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('@clerk/react', () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock('@nota/note-runtime/stores/preferences', () => ({
  useNotaPreferencesStore: <T,>(
    selector: (s: {
      openTodaysNoteShortcut: boolean;
      semanticSearchEnabled: boolean;
    }) => T,
  ): T =>
    selector({
      openTodaysNoteShortcut: false,
      semanticSearchEnabled: false,
    }),
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

function renderPalette(): ReturnType<typeof render> {
  return render(
    <ThemeProvider defaultTheme="light" storageKey="nota-test-theme-cmdk">
      <CommandPalette />
    </ThemeProvider>,
  );
}

describe('CommandPalette', () => {
  it('clears the search input when the user starts the move flow (Move note…)', async () => {
    // Arrange: open palette and type a filter before choosing Move note…
    renderPalette();
    fireEvent.keyDown(document, { key: 'k', metaKey: true, bubbles: true });
    const input = await screen.findByPlaceholderText('Type a command…');
    // Deliberate filter that must stay in the list so the item is clickable
    fireEvent.input(input, { target: { value: 'move' } });
    const dialog = await screen.findByRole('dialog');
    const moveItem = within(dialog).getByText('Move note…');

    // Act: enter move flow (pick note)
    fireEvent.click(moveItem);

    // Assert: search field must not keep the previous filter
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('starts folder rename flow and dispatches rename request', async () => {
    // Arrange
    renderPalette();
    fireEvent.keyDown(document, { key: 'k', metaKey: true, bubbles: true });
    const dialog = await screen.findByRole('dialog');

    // Act
    fireEvent.click(within(dialog).getByText('Rename folder…'));
    fireEvent.click(within(dialog).getByText('Computer Science Study'));

    // Assert
    expect(dispatchRenameFolderRequest).toHaveBeenCalledWith('folder-1');
  });

  it('runs tint folder flow and applies a folder tint', async () => {
    // Arrange
    renderPalette();
    fireEvent.keyDown(document, { key: 'k', metaKey: true, bubbles: true });
    const dialog = await screen.findByRole('dialog');

    // Act
    fireEvent.click(within(dialog).getByText('Tint folder…'));
    fireEvent.click(within(dialog).getByText('Computer Science Study'));
    fireEvent.click(within(dialog).getByText('Folder tint Blue'));

    // Assert
    expect(clientUpdateFolderTint).toHaveBeenCalledWith(
      expect.objectContaining({
        folderId: 'folder-1',
        nextPersistedTint: 'blue',
        previousPersistedTint: null,
        userId: 'user-1',
      }),
    );
  });

  it('opens the move flow from the menubar request event', async () => {
    // Arrange
    renderPalette();

    // Act
    act(() => {
      window.dispatchEvent(new Event(NOTA_MENUBAR_MOVE_NOTE_REQUEST_EVENT));
    });

    // Assert
    expect(await screen.findByText('Move note: pick note')).toBeTruthy();
  });
});
