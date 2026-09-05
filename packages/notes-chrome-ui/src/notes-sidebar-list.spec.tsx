import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesSidebarList } from './notes-sidebar-list';
import { useNotesSidebarStore } from '@getmadrid/note-runtime/stores/sidebar';
import { clientUpdateFolderTint } from '@getmadrid/note-folders-ui/update-folder-tint-client';
import { clientRenameFolder } from '@getmadrid/note-folders-ui/rename-folder-client';
import { clientMoveNoteToFolder } from '@getmadrid/note-folders-ui/move-note-folder-client';
import { clientCreateNote } from '@getmadrid/note-folders-ui/create-note-client';

vi.mock('@getmadrid/note-folders-ui/rename-folder-client', () => ({
  clientRenameFolder: vi.fn(() => Promise.resolve()),
}));

vi.mock('@getmadrid/note-folders-ui/move-note-folder-client', () => ({
  clientMoveNoteToFolder: vi.fn(() => Promise.resolve()),
}));

vi.mock('@getmadrid/note-folders-ui/update-folder-tint-client', () => ({
  clientUpdateFolderTint: vi.fn(() => Promise.resolve()),
}));

vi.mock('@getmadrid/note-folders-ui/create-note-client', () => ({
  clientCreateNote: vi.fn(() => Promise.resolve()),
}));

describe('NotesSidebarList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotesSidebarStore.setState({ open: true, collapsedFolderIds: [] });
  });

  it('renders note title only without the last updated date', () => {
    // Arrange
    const updatedAt = '2026-04-15T12:00:00.000Z';
    const formattedDate = new Date(updatedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    render(
      <NotesSidebarList
        notes={[
          {
            id: 'note-1',
            user_id: 'user-1',
            title: 'Alpha note',
            content: {},
            created_at: updatedAt,
            updated_at: updatedAt,
            due_at: null,
            is_deadline: false,
            editor_settings: {},
            banner_attachment_id: null,
            folder_id: null,
            share_token: null,
          },
        ]}
        folders={[]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    // Assert
    expect(screen.getByText('Alpha note')).toBeTruthy();
    expect(screen.queryByText(formattedDate)).toBeNull();
  });

  it.each([true, false])(
    'renders a note icon and selection weight when active is %s',
    (active) => {
      // Arrange
      render(
        <NotesSidebarList
          notes={[
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
              share_token: null,
            },
          ]}
          folders={[]}
          panel={active ? 'note' : 'list'}
          routeNoteId={active ? 'note-1' : null}
          userId="user-1"
          notaProEntitled
          userPreferences={null}
          insertNoteAtFront={vi.fn()}
          insertFolderSorted={vi.fn()}
          patchNoteInList={vi.fn()}
          patchFolderInList={vi.fn()}
          removeNoteFromList={vi.fn()}
          removeFolderFromList={vi.fn()}
          refreshNotesList={vi.fn(() => Promise.resolve())}
        />,
      );

      // Act
      const noteLink = screen.getByRole('link', { name: 'Alpha note' });
      const noteRow = noteLink.parentElement;

      // Assert
      expect(noteLink.className).toContain(
        active ? 'font-semibold' : 'font-normal',
      );
      expect(
        noteRow?.querySelector('[data-nota-sidebar-note-icon]'),
      ).toBeTruthy();
    },
  );

  it('allows inline folder rename on double click and commits on blur', () => {
    // Arrange
    const patchFolderInList = vi.fn();

    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={patchFolderInList}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    // Act
    fireEvent.doubleClick(screen.getByText('Computer Science Study'));
    const renameInput = screen.getByLabelText(
      'Rename folder Computer Science Study',
    );
    if (!(renameInput instanceof HTMLInputElement)) {
      throw new Error('expected folder rename input');
    }
    const hasFocusAfterRename = document.activeElement === renameInput;
    const caretStartAfterRename = renameInput.selectionStart;
    const caretEndAfterRename = renameInput.selectionEnd;
    const valueLengthAfterRename = renameInput.value.length;

    fireEvent.change(renameInput, { target: { value: 'Computer Science I' } });
    fireEvent.blur(renameInput);

    // Assert
    expect(hasFocusAfterRename).toBe(true);
    expect(caretStartAfterRename).toBe(valueLengthAfterRename);
    expect(caretEndAfterRename).toBe(valueLengthAfterRename);
    expect(clientRenameFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        folderId: 'folder-1',
        previousName: 'Computer Science Study',
        nextName: 'Computer Science I',
        userId: 'user-1',
        notaProEntitled: true,
        patchFolderInList,
      }),
    );
  });

  it('starts inline rename when F2 is pressed on a folder row', () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );
    const folderLabel = screen.getByText('Computer Science Study');
    const folderRowButton = folderLabel.closest('button') as HTMLButtonElement;

    // Act
    folderRowButton.focus();
    fireEvent.keyDown(folderRowButton, { key: 'F2' });

    // Assert
    expect(
      screen.getByLabelText('Rename folder Computer Science Study'),
    ).toBeTruthy();
  });

  it('moves a note into a folder when dropped on the folder row', () => {
    // Arrange
    const patchNoteInList = vi.fn();
    render(
      <NotesSidebarList
        notes={[
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
            share_token: null,
          },
        ]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={patchNoteInList}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    const noteRow = screen.getByText('Alpha note').closest('li')
      ?.firstElementChild as HTMLDivElement;
    const folderLabel = screen.getByText('Computer Science Study');
    const folderRow = folderLabel.closest('button')
      ?.parentElement as HTMLDivElement;

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(() => 'note-1'),
    } as unknown as DataTransfer;

    // Act
    fireEvent.dragStart(noteRow, { dataTransfer });
    fireEvent.dragEnter(folderRow, { dataTransfer });
    fireEvent.dragOver(folderRow, { dataTransfer });
    fireEvent.drop(folderRow, { dataTransfer });

    // Assert
    expect(patchNoteInList).toHaveBeenCalledWith('note-1', {
      folder_id: 'folder-1',
    });
    expect(clientMoveNoteToFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId: 'note-1',
        targetFolderId: 'folder-1',
        previousFolderId: null,
        userId: 'user-1',
        notaProEntitled: true,
      }),
    );
  });

  it('moves a note back to root when dropped on the root notes area', () => {
    // Arrange
    const patchNoteInList = vi.fn();
    render(
      <NotesSidebarList
        notes={[
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
            folder_id: 'folder-1',
            share_token: null,
          },
          {
            id: 'note-2',
            user_id: 'user-1',
            title: 'Root note',
            content: {},
            created_at: '2026-04-16T12:00:00.000Z',
            updated_at: '2026-04-16T12:00:00.000Z',
            due_at: null,
            is_deadline: false,
            editor_settings: {},
            banner_attachment_id: null,
            folder_id: null,
            share_token: null,
          },
        ]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={patchNoteInList}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    const draggedRow = screen.getByText('Alpha note').closest('li')
      ?.firstElementChild as HTMLDivElement;
    const rootDropRow = screen
      .getByText('Root note')
      .closest('li') as HTMLLIElement;

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(() => 'note-1'),
    } as unknown as DataTransfer;

    // Act
    fireEvent.dragStart(draggedRow, { dataTransfer });
    fireEvent.dragOver(rootDropRow, { dataTransfer });
    fireEvent.drop(rootDropRow, { dataTransfer });

    // Assert
    expect(patchNoteInList).toHaveBeenCalledWith('note-1', {
      folder_id: null,
    });
    expect(clientMoveNoteToFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId: 'note-1',
        targetFolderId: null,
        previousFolderId: 'folder-1',
        userId: 'user-1',
        notaProEntitled: true,
      }),
    );
  });

  it('opens a context menu with move and delete actions', async () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[
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
            share_token: null,
          },
        ]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    const noteRow = screen.getByText('Alpha note').closest('li')
      ?.firstElementChild as HTMLDivElement;

    // Act
    fireEvent.contextMenu(noteRow);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Move to')).toBeTruthy();
      expect(screen.getByText('Delete note')).toBeTruthy();
    });
  });

  it('opens a folder context menu with rename and delete actions', async () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    const folderLabel = screen.getByText('Computer Science Study');
    const folderRow = folderLabel.closest('li')
      ?.firstElementChild as HTMLDivElement;

    expect(
      screen.queryByLabelText('Delete folder Computer Science Study'),
    ).toBeNull();

    // Act
    fireEvent.contextMenu(folderRow);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeTruthy();
      expect(screen.getByText('Delete folder')).toBeTruthy();
    });
  });

  it('renders a nested folder and moves a note when dropped on the inner folder row', () => {
    // Arrange
    const patchNoteInList = vi.fn();
    render(
      <NotesSidebarList
        notes={[
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
            share_token: null,
          },
        ]}
        folders={[
          {
            id: 'folder-parent',
            user_id: 'user-1',
            name: 'Parent',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
          {
            id: 'folder-child',
            user_id: 'user-1',
            name: 'Child',
            parent_id: 'folder-parent',
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={patchNoteInList}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    expect(screen.getByText('Child')).toBeTruthy();

    const noteRow = screen.getByText('Alpha note').closest('li')
      ?.firstElementChild as HTMLDivElement;
    const childFolderLabel = screen.getByText('Child');
    const childFolderRow = childFolderLabel.closest('button')
      ?.parentElement as HTMLDivElement;

    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(() => 'note-1'),
    } as unknown as DataTransfer;

    // Act
    fireEvent.dragStart(noteRow, { dataTransfer });
    fireEvent.dragEnter(childFolderRow, { dataTransfer });
    fireEvent.dragOver(childFolderRow, { dataTransfer });
    fireEvent.drop(childFolderRow, { dataTransfer });

    // Assert
    expect(patchNoteInList).toHaveBeenCalledWith('note-1', {
      folder_id: 'folder-child',
    });
    expect(clientMoveNoteToFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId: 'note-1',
        targetFolderId: 'folder-child',
        previousFolderId: null,
      }),
    );
  });

  it('marks the folder branch expanded by default', () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Expanded folder',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );
    // Act
    const expandButton = screen.getByRole('button', {
      name: 'Collapse folder Expanded folder',
    });
    const branch = document.getElementById('sidebar-folder-folder-1');

    // Assert
    expect(expandButton).toBeTruthy();
    expect(branch).toBeTruthy();
    expect(branch?.getAttribute('data-expanded')).toBe('true');
    expect(branch?.getAttribute('aria-hidden')).toBe('false');
    expect(branch?.hasAttribute('inert')).toBe(false);
  });

  it('keeps the folder branch mounted when collapsed', () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Expanded folder',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );
    const collapseButton = screen.getByRole('button', {
      name: 'Collapse folder Expanded folder',
    });

    // Act
    fireEvent.click(collapseButton);
    const branch = document.getElementById('sidebar-folder-folder-1');

    // Assert
    expect(branch).toBeTruthy();
    expect(branch?.getAttribute('data-expanded')).toBe('false');
    expect(branch?.getAttribute('aria-hidden')).toBe('true');
    expect(branch?.hasAttribute('inert')).toBe(true);
  });

  it('exposes data-folder-tint when a folder has a persisted tint', () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Tinted folder',
            parent_id: null,
            tint: 'blue',
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    // Assert
    expect(document.querySelector('[data-folder-tint="blue"]')).toBeTruthy();
  });

  it('does not apply a tinted row background on folders with a persisted tint', () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Tinted folder',
            parent_id: null,
            tint: 'blue',
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    // Act
    const row = document.querySelector(
      '[data-folder-tint="blue"]',
    ) as HTMLDivElement;

    // Assert
    expect(row).toBeTruthy();
    expect(row.style.background).toBe('');
  });

  it.each(['green', null, '', 'invalid'])(
    'shows a coloured dot and neutral name for tint %s',
    (tint) => {
      // Arrange
      render(
        <NotesSidebarList
          notes={[]}
          folders={[
            {
              id: 'folder-1',
              user_id: 'user-1',
              name: 'Tinted folder',
              parent_id: null,
              tint,
              created_at: '2026-04-25T00:00:00.000Z',
              updated_at: '2026-04-25T00:00:00.000Z',
            },
          ]}
          panel="list"
          routeNoteId={null}
          userId="user-1"
          notaProEntitled
          userPreferences={null}
          insertNoteAtFront={vi.fn()}
          insertFolderSorted={vi.fn()}
          patchNoteInList={vi.fn()}
          patchFolderInList={vi.fn()}
          removeNoteFromList={vi.fn()}
          removeFolderFromList={vi.fn()}
          refreshNotesList={vi.fn(() => Promise.resolve())}
        />,
      );

      // Act
      const label = screen.getByText('Tinted folder');
      const trigger = screen.getByRole('button', {
        name: 'Tint folder Tinted folder',
      });
      const dot = trigger?.querySelector('span.rounded-full');

      // Assert
      expect(label.className).not.toContain('nota-folder-tint-accent');
      expect(trigger?.querySelector('svg')).toBeNull();
      expect(dot).toBeTruthy();
      expect(dot?.getAttribute('style')).toContain(
        tint === 'green' ? 'oklch(0.55 0.14 145)' : 'oklch(0.55 0.02 250)',
      );
    },
  );

  it('selects the direct folder, weights expanded folders, and changes colour without collapsing', async () => {
    // Arrange
    const timestamp = '2026-04-25T00:00:00.000Z';
    const props: ComponentProps<typeof NotesSidebarList> = {
      notes: [
        {
          id: 'note-1',
          user_id: 'user-1',
          title: 'Nested note',
          content: {},
          created_at: timestamp,
          updated_at: timestamp,
          due_at: null,
          is_deadline: false,
          editor_settings: {},
          banner_attachment_id: null,
          folder_id: 'child',
          share_token: null,
        },
      ],
      folders: [
        {
          id: 'parent',
          name: 'Parent',
          parent_id: null,
          tint: 'blue',
          user_id: 'user-1',
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'child',
          name: 'Child',
          parent_id: 'parent',
          tint: null,
          user_id: 'user-1',
          created_at: timestamp,
          updated_at: timestamp,
        },
      ],
      panel: 'note',
      routeNoteId: 'note-1',
      userId: 'user-1',
      notaProEntitled: true,
      userPreferences: null,
      insertNoteAtFront: vi.fn(),
      insertFolderSorted: vi.fn(),
      patchNoteInList: vi.fn(),
      patchFolderInList: vi.fn(),
      removeNoteFromList: vi.fn(),
      removeFolderFromList: vi.fn(),
      refreshNotesList: vi.fn(() => Promise.resolve()),
    };

    // Act
    const { rerender } = render(<NotesSidebarList {...props} />);

    // Assert
    expect(screen.getByText('Child').className).toContain('font-semibold');
    expect(screen.getByText('Parent').className).toContain('font-semibold');
    expect(
      document.querySelectorAll(
        '[data-slot="sidebar-folder-row"][data-selected]',
      ),
    ).toHaveLength(1);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Tint folder Child' }));
    const blue = await screen.findByRole('menuitem', {
      name: 'Folder tint Blue',
    });
    fireEvent.click(blue);

    // Assert
    expect(clientUpdateFolderTint).toHaveBeenCalledWith({
      folderId: 'child',
      nextPersistedTint: 'blue',
      previousPersistedTint: null,
      userId: 'user-1',
      notaProEntitled: true,
      patchFolderInList: props.patchFolderInList,
    });
    expect(
      screen
        .getByRole('button', { name: 'Collapse folder Child' })
        .getAttribute('aria-expanded'),
    ).toBe('true');

    // Act
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse folder Child' }),
    );

    // Assert
    expect(screen.getByText('Child').className).toContain('font-semibold');

    // Act
    rerender(<NotesSidebarList {...props} panel="settings" />);

    // Assert
    expect(
      document.querySelectorAll(
        '[data-slot="sidebar-folder-row"][data-selected]',
      ),
    ).toHaveLength(0);
    expect(screen.getByText('Child').className).toContain('font-normal');
  });

  it('shows Create note in the folder context menu and creates a note in that folder', async () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    const folderRow = screen.getByText('Computer Science Study').closest('li')
      ?.firstElementChild as HTMLDivElement;

    // Act
    fireEvent.contextMenu(folderRow);
    fireEvent.click(await screen.findByText('Create note'));

    // Assert
    await waitFor(() => {
      expect(clientCreateNote).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          folderId: 'folder-1',
          notaProEntitled: true,
        }),
      );
    });
  });

  it('shows Create note and Create folder on the root container context menu', async () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Top folder',
            parent_id: null,
            tint: null,
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        insertFolderSorted={vi.fn()}
        patchNoteInList={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    const tree = screen.getByRole('tree');
    const rootLi = tree.querySelector(':scope > li:last-child');
    const rootTrigger = rootLi?.firstElementChild as HTMLDivElement;

    // Act
    fireEvent.contextMenu(rootTrigger);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Create note')).toBeTruthy();
      expect(screen.getByText('Create folder')).toBeTruthy();
    });

    // Act
    fireEvent.click(screen.getByText('Create folder'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('New folder')).toBeTruthy();
    });
  });
});
