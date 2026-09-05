import { describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';
import { DEFAULT_NOTE_CONTENT } from './types';
import type { StoredNote } from './types';
import { createVaultMutator } from './vault-mutator';
import type {
  LocalNoteMutationStore,
  VaultMutatorDeps,
} from './vault-mutation-ports';
import type { RemoteNoteSync, VaultConnectivity } from './outbox-ports';

function makeStoredNote(
  overrides: Partial<StoredNote> & { id: string },
): StoredNote {
  return {
    id: overrides.id,
    user_id: overrides.user_id ?? 'user-1',
    title: overrides.title ?? 'Test note',
    content: overrides.content ?? DEFAULT_NOTE_CONTENT,
    created_at: overrides.created_at ?? '2024-01-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2024-01-02T00:00:00.000Z',
    due_at: overrides.due_at ?? null,
    is_deadline: overrides.is_deadline ?? false,
    editor_settings: overrides.editor_settings ?? {},
    banner_attachment_id: overrides.banner_attachment_id ?? null,
    folder_id: overrides.folder_id ?? null,
    share_token: overrides.share_token ?? null,
    dirty: overrides.dirty ?? true,
    pending_create: overrides.pending_create ?? false,
    pending_delete: overrides.pending_delete ?? false,
    server_updated_at: overrides.server_updated_at ?? null,
  };
}

class InMemoryMutationStore implements LocalNoteMutationStore {
  readonly notes = new Map<string, StoredNote>();

  async getStoredNote(
    _userId: string,
    noteId: string,
  ): Promise<StoredNote | null> {
    return this.notes.get(noteId) ?? null;
  }

  async listOutbox(): Promise<never[]> {
    return [];
  }

  async removeOutboxEntry(): Promise<void> {
    return undefined;
  }

  markNoteSyncedFromServer = vi.fn<
    LocalNoteMutationStore['markNoteSyncedFromServer']
  >(async () => undefined);

  async removeStoredNote(): Promise<void> {
    return undefined;
  }

  saveLocalNoteDraft = vi.fn<LocalNoteMutationStore['saveLocalNoteDraft']>(
    async () => undefined,
  );

  createLocalOnlyNote = vi.fn<LocalNoteMutationStore['createLocalOnlyNote']>(
    async () => 'local-note-id',
  );

  markPendingDelete = vi.fn<LocalNoteMutationStore['markPendingDelete']>(
    async () => undefined,
  );
}

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    id: overrides.id,
    user_id: overrides.user_id ?? 'user-1',
    title: overrides.title ?? 'Untitled Note',
    content: overrides.content ?? DEFAULT_NOTE_CONTENT,
    created_at: overrides.created_at ?? '2024-01-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2024-01-02T00:00:00.000Z',
    due_at: overrides.due_at ?? null,
    is_deadline: overrides.is_deadline ?? false,
    editor_settings: overrides.editor_settings ?? {},
    banner_attachment_id: overrides.banner_attachment_id ?? null,
    folder_id: overrides.folder_id ?? null,
    share_token: overrides.share_token ?? null,
  };
}

function makeDeps(
  overrides: {
    local?: InMemoryMutationStore;
    remote?: Partial<RemoteNoteSync>;
    connectivity?: Partial<VaultConnectivity>;
  } = {},
): VaultMutatorDeps & { local: InMemoryMutationStore } {
  const local = overrides.local ?? new InMemoryMutationStore();
  const remote: RemoteNoteSync = {
    createNote: vi.fn(),
    createNoteEager: vi.fn(async () => makeNote({ id: 'remote-note-id' })),
    updateNote: vi.fn(async () => makeNote({ id: 'note-1' })),
    deleteNote: vi.fn(async () => undefined),
    ...overrides.remote,
  };
  const connectivity: VaultConnectivity = {
    isOnline: () => true,
    canSync: async () => true,
    ...overrides.connectivity,
  };
  const drainer = { drain: vi.fn(async () => false) };
  return { local, remote, connectivity, drainer };
}

describe('createVaultMutator.createNote', () => {
  it('creates on the remote store when online and sync is allowed', async () => {
    // Arrange
    const deps = makeDeps();
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.createNote('user-1', { folderId: 'folder-a' });

    // Assert
    expect(result.outcome).toBe('created-remote');
    if (result.outcome === 'created-remote') {
      expect(result.note.id).toBe('remote-note-id');
    }
    expect(deps.remote.createNoteEager).toHaveBeenCalledWith('user-1', {
      title: 'Untitled Note',
      folder_id: 'folder-a',
    });
    expect(deps.local.createLocalOnlyNote).not.toHaveBeenCalled();
    expect(deps.drainer.drain).not.toHaveBeenCalled();
  });

  it('creates locally when offline', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { isOnline: () => false },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.createNote('user-1');

    // Assert
    expect(result).toEqual({
      outcome: 'created-local',
      noteId: 'local-note-id',
    });
    expect(deps.local.createLocalOnlyNote).toHaveBeenCalledWith(
      'user-1',
      'Untitled Note',
      undefined,
      null,
    );
    expect(deps.remote.createNoteEager).not.toHaveBeenCalled();
    expect(deps.drainer.drain).not.toHaveBeenCalled();
  });

  it('creates locally when the remote create fails', async () => {
    // Arrange
    const deps = makeDeps({
      remote: {
        createNoteEager: vi.fn(async () => {
          throw new Error('network');
        }),
      },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.createNote('user-1', { folderId: null });

    // Assert
    expect(result).toEqual({
      outcome: 'created-local',
      noteId: 'local-note-id',
    });
    expect(deps.local.createLocalOnlyNote).toHaveBeenCalledWith(
      'user-1',
      'Untitled Note',
      undefined,
      null,
    );
  });

  it('creates locally when online but sync is not allowed', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { canSync: async () => false },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.createNote('user-1');

    // Assert
    expect(result.outcome).toBe('created-local');
    expect(deps.remote.createNoteEager).not.toHaveBeenCalled();
  });
});

describe('createVaultMutator.patchNote', () => {
  it('patches remotely after saving a draft when online', async () => {
    // Arrange
    const deps = makeDeps();
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.patchNote('user-1', {
      noteId: 'note-1',
      fields: { title: 'New title' },
      draftContext: {
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00.000Z',
        content: DEFAULT_NOTE_CONTENT,
      },
    });

    // Assert
    expect(result.outcome).toBe('patched-remote');
    expect(deps.local.saveLocalNoteDraft).toHaveBeenCalled();
    expect(deps.remote.updateNote).toHaveBeenCalledWith('note-1', {
      title: 'New title',
    });
    expect(deps.local.markNoteSyncedFromServer).toHaveBeenCalled();
    expect(deps.drainer.drain).not.toHaveBeenCalled();
  });

  it('returns patched-local when draft-first and offline', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { isOnline: () => false },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.patchNote('user-1', {
      noteId: 'note-1',
      fields: { content: DEFAULT_NOTE_CONTENT },
      draftContext: {
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00.000Z',
        title: 'Title',
      },
    });

    // Assert
    expect(result).toEqual({ outcome: 'patched-local' });
    expect(deps.local.saveLocalNoteDraft).toHaveBeenCalled();
    expect(deps.remote.updateNote).not.toHaveBeenCalled();
    expect(deps.drainer.drain).not.toHaveBeenCalled();
  });

  it('queues a local patch when remote-first and offline', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { isOnline: () => false },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.patchNote('user-1', {
      noteId: 'note-1',
      fields: { folder_id: 'folder-a' },
    });

    // Assert
    expect(result).toEqual({ outcome: 'patched-local' });
    expect(deps.local.saveLocalNoteDraft).toHaveBeenCalledWith('user-1', {
      id: 'note-1',
      folder_id: 'folder-a',
    });
    expect(deps.drainer.drain).toHaveBeenCalledWith('user-1');
  });

  it('patches remotely for remote-first when online', async () => {
    // Arrange
    const deps = makeDeps();
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.patchNote('user-1', {
      noteId: 'note-1',
      fields: { folder_id: 'folder-a' },
    });

    // Assert
    expect(result.outcome).toBe('patched-remote');
    expect(deps.local.saveLocalNoteDraft).not.toHaveBeenCalled();
    expect(deps.remote.updateNote).toHaveBeenCalledWith('note-1', {
      folder_id: 'folder-a',
    });
  });

  it('drains after draft-first remote failure', async () => {
    // Arrange
    const deps = makeDeps({
      remote: {
        updateNote: vi.fn(async () => {
          throw new Error('network');
        }),
      },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.patchNote('user-1', {
      noteId: 'note-1',
      fields: { title: 'Edited' },
      draftContext: {
        user_id: 'user-1',
        created_at: '2024-01-01T00:00:00.000Z',
      },
    });

    // Assert
    expect(result).toEqual({ outcome: 'patched-local' });
    expect(deps.drainer.drain).toHaveBeenCalledWith('user-1');
  });
});

describe('createVaultMutator.deleteNote', () => {
  it('queues a local delete when offline', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { isOnline: () => false },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.deleteNote('user-1', 'note-1');

    // Assert
    expect(result).toEqual({ outcome: 'queued-local-delete' });
    expect(deps.local.markPendingDelete).toHaveBeenCalledWith(
      'user-1',
      'note-1',
      true,
    );
    expect(deps.drainer.drain).toHaveBeenCalledWith('user-1');
    expect(deps.remote.deleteNote).not.toHaveBeenCalled();
  });

  it('deletes on the remote store when online and sync is allowed', async () => {
    // Arrange
    const deps = makeDeps();
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.deleteNote('user-1', 'note-1');

    // Assert
    expect(result).toEqual({ outcome: 'deleted-remote' });
    expect(deps.remote.deleteNote).toHaveBeenCalledWith('note-1');
    expect(deps.local.markPendingDelete).not.toHaveBeenCalled();
    expect(deps.drainer.drain).not.toHaveBeenCalled();
  });

  it('queues a local delete when the remote delete fails', async () => {
    // Arrange
    const deps = makeDeps({
      remote: {
        deleteNote: vi.fn(async () => {
          throw new Error('network');
        }),
      },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.deleteNote('user-1', 'note-1');

    // Assert
    expect(result).toEqual({ outcome: 'queued-local-delete' });
    expect(deps.local.markPendingDelete).toHaveBeenCalled();
    expect(deps.drainer.drain).toHaveBeenCalledWith('user-1');
  });

  it('queues a local delete when online but sync is not allowed', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { canSync: async () => false },
    });
    const mutator = createVaultMutator(deps);

    // Act
    const result = await mutator.deleteNote('user-1', 'note-1');

    // Assert
    expect(result).toEqual({ outcome: 'queued-local-delete' });
    expect(deps.remote.deleteNote).not.toHaveBeenCalled();
  });

  it('marks pending delete as not synced for a pending_create note', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { isOnline: () => false },
    });
    deps.local.notes.set(
      'note-1',
      makeStoredNote({ id: 'note-1', pending_create: true }),
    );
    const mutator = createVaultMutator(deps);

    // Act
    await mutator.deleteNote('user-1', 'note-1');

    // Assert
    expect(deps.local.markPendingDelete).toHaveBeenCalledWith(
      'user-1',
      'note-1',
      false,
    );
  });
});
