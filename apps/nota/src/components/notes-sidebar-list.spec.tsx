import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesSidebarList } from './notes-sidebar-list';
import { useNotesSidebarStore } from '../stores/notes-sidebar';
import { clientRenameFolder } from '../lib/rename-folder-client';
import { clientMoveNoteToFolder } from '../lib/move-note-folder-client';
import { clientCreateNote } from '../lib/create-note-client';

vi.mock('../lib/rename-folder-client', () => ({
  clientRenameFolder: vi.fn(() => Promise.resolve()),
}));

vi.mock('../lib/move-note-folder-client', () => ({
  clientMoveNoteToFolder: vi.fn(() => Promise.resolve()),
}));

vi.mock('../lib/update-folder-tint-client', () => ({
  clientUpdateFolderTint: vi.fn(() => Promise.resolve()),
}));

vi.mock('../lib/create-note-client', () => ({
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

  it('rotates the folder chevron when the folder is expanded', () => {
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
    const expandButton = screen.getByRole('button', {
      name: 'Collapse folder Expanded folder',
    });

    // Act
    const chevron = expandButton.querySelector('svg');
    const branch = document.getElementById('sidebar-folder-folder-1');

    // Assert
    expect(chevron?.getAttribute('class') ?? '').toContain('rotate-90');
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

  it('applies tint accent class to the folder icon and name when tinted', () => {
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
            tint: 'green',
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
    const iconWrapper = label
      .closest('button')
      ?.querySelector('.nota-folder-tint-accent');

    // Assert
    expect(label.className).toContain('nota-folder-tint-accent');
    expect(iconWrapper).toBeTruthy();
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
