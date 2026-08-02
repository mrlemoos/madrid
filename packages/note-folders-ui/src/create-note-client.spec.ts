import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientCreateNote } from './create-note-client';
import { vaultMutator } from '@nota/data-source/vault-runtime';
import { recordWritingActivityToday } from '@nota/writing-activity-ui/tracking';
import { setAppHash } from '@nota/app-navigation-core/navigation';

const insertNoteAtFront = vi.fn();
const refreshNotesList = vi.fn();

vi.mock('@nota/data-source/vault-runtime', () => ({
  vaultMutator: {
    createNote: vi.fn(),
  },
}));

vi.mock('@nota/app-navigation-core/navigation', () => ({
  setAppHash: vi.fn(),
}));

vi.mock('@nota/writing-activity-ui/tracking', () => ({
  recordWritingActivityToday: vi.fn(),
}));

describe('clientCreateNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when not entitled', async () => {
    // Arrange
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: false,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(vaultMutator.createNote).not.toHaveBeenCalled();
    expect(refreshNotesList).not.toHaveBeenCalled();
  });

  it('inserts the server row when the mutation creates remotely', async () => {
    // Arrange
    const serverNote = {
      id: 'server-note-id',
      user_id: 'u1',
      title: 'Untitled Note',
      content: { type: 'doc', content: [] },
      created_at: '',
      updated_at: '',
      due_at: null,
      is_deadline: false,
      editor_settings: {},
      banner_attachment_id: null,
      folder_id: 'folder-1',
    };
    vi.mocked(vaultMutator.createNote).mockResolvedValue({
      outcome: 'created-remote',
      note: serverNote,
    });
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: true,
      folderId: 'folder-1' as const,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(vaultMutator.createNote).toHaveBeenCalledWith('u1', {
      folderId: 'folder-1',
    });
    expect(insertNoteAtFront).toHaveBeenCalledWith(serverNote);
    expect(setAppHash).toHaveBeenCalledWith({
      kind: 'notes',
      panel: 'note',
      noteId: 'server-note-id',
    });
    expect(refreshNotesList).toHaveBeenCalledWith({ silent: true });
    expect(recordWritingActivityToday).toHaveBeenCalledOnce();
  });

  it('creates at root remotely when folderId is omitted', async () => {
    // Arrange
    vi.mocked(vaultMutator.createNote).mockResolvedValue({
      outcome: 'created-remote',
      note: {
        id: 'server-note-id',
        user_id: 'u1',
        title: 'Untitled Note',
        content: { type: 'doc', content: [] },
        created_at: '',
        updated_at: '',
        due_at: null,
        is_deadline: false,
        editor_settings: {},
        banner_attachment_id: null,
        folder_id: null,
      },
    });
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: true,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(vaultMutator.createNote).toHaveBeenCalledWith('u1', {
      folderId: undefined,
    });
    expect(insertNoteAtFront).toHaveBeenCalled();
    expect(refreshNotesList).toHaveBeenCalled();
  });

  it('navigates to a local note without inserting at front when offline', async () => {
    // Arrange
    vi.mocked(vaultMutator.createNote).mockResolvedValue({
      outcome: 'created-local',
      noteId: 'local-note-id',
    });
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: true,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(insertNoteAtFront).not.toHaveBeenCalled();
    expect(setAppHash).toHaveBeenCalledWith({
      kind: 'notes',
      panel: 'note',
      noteId: 'local-note-id',
    });
    expect(refreshNotesList).toHaveBeenCalledWith({ silent: true });
    expect(recordWritingActivityToday).toHaveBeenCalledOnce();
  });
});
