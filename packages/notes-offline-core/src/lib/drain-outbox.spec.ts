import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_NOTE_CONTENT } from './types';
import type { Note } from '@nota/database-types';
import type { OutboxEntry, StoredNote } from './types';
import {
  createOutboxDrainer,
  drainOutbox,
  storedNoteToRemoteUpsertInput,
} from './drain-outbox';
import type {
  LocalNoteOutboxStore,
  OutboxDrainDeps,
  RemoteNoteSync,
  VaultConnectivity,
} from './outbox-ports';

function makeNote(overrides: Partial<Note> & { id: string }): Note {
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
  };
}

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

class InMemoryOutboxStore implements LocalNoteOutboxStore {
  readonly notes = new Map<string, StoredNote>();
  readonly outbox: OutboxEntry[] = [];

  async getStoredNote(
    _userId: string,
    noteId: string,
  ): Promise<StoredNote | null> {
    return this.notes.get(noteId) ?? null;
  }

  async listOutbox(_userId: string): Promise<OutboxEntry[]> {
    return [...this.outbox];
  }

  async removeOutboxEntry(_userId: string, noteId: string): Promise<void> {
    const idx = this.outbox.findIndex((e) => e.noteId === noteId);
    if (idx >= 0) {
      this.outbox.splice(idx, 1);
    }
  }

  async markNoteSyncedFromServer(userId: string, note: Note): Promise<void> {
    this.notes.set(
      note.id,
      makeStoredNote({
        ...note,
        dirty: false,
        pending_create: false,
        pending_delete: false,
        server_updated_at: note.updated_at,
      }),
    );
    await this.removeOutboxEntry(userId, note.id);
  }

  async removeStoredNote(_userId: string, noteId: string): Promise<void> {
    this.notes.delete(noteId);
    await this.removeOutboxEntry(_userId, noteId);
  }
}

function makeDeps(
  overrides: {
    local?: InMemoryOutboxStore;
    remote?: Partial<RemoteNoteSync>;
    connectivity?: Partial<VaultConnectivity>;
  } = {},
): OutboxDrainDeps & { local: InMemoryOutboxStore } {
  const local = overrides.local ?? new InMemoryOutboxStore();
  const remote: RemoteNoteSync = {
    createNote: vi.fn<RemoteNoteSync['createNote']>(async (_userId, input) =>
      makeNote({ id: input.id, title: input.title }),
    ),
    createNoteEager: vi.fn<RemoteNoteSync['createNoteEager']>(async () =>
      makeNote({ id: 'eager-note-id' }),
    ),
    updateNote: vi.fn<RemoteNoteSync['updateNote']>(async (noteId, input) =>
      makeNote({ id: noteId, title: input.title }),
    ),
    deleteNote: vi.fn<RemoteNoteSync['deleteNote']>(async () => undefined),
    ...overrides.remote,
  };
  const connectivity: VaultConnectivity = {
    isOnline: () => true,
    canSync: async () => true,
    ...overrides.connectivity,
  };
  return { local, remote, connectivity };
}

describe('storedNoteToRemoteUpsertInput', () => {
  it('maps stored row fields for remote upsert', () => {
    // Arrange
    const stored = makeStoredNote({
      id: 'n1',
      title: 'Title',
      folder_id: 'folder-a',
    });

    // Act
    const input = storedNoteToRemoteUpsertInput(stored);

    // Assert
    expect(input.title).toBe('Title');
    expect(input.folder_id).toBe('folder-a');
  });
});

describe('drainOutbox', () => {
  it('returns false when offline', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { isOnline: () => false },
    });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(false);
    expect(deps.remote.createNote).not.toHaveBeenCalled();
  });

  it('returns false when sync is not allowed', async () => {
    // Arrange
    const deps = makeDeps({
      connectivity: { canSync: async () => false },
    });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(false);
    expect(deps.remote.updateNote).not.toHaveBeenCalled();
  });

  it('creates a pending_create note on the remote store', async () => {
    // Arrange
    const deps = makeDeps();
    deps.local.notes.set(
      'new-note',
      makeStoredNote({ id: 'new-note', pending_create: true }),
    );
    deps.local.outbox.push({ noteId: 'new-note', kind: 'upsert' });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(true);
    expect(deps.remote.createNote).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ id: 'new-note' }),
    );
    expect(deps.local.outbox).toHaveLength(0);
  });

  it('updates an existing note on the remote store', async () => {
    // Arrange
    const deps = makeDeps();
    deps.local.notes.set(
      'note-1',
      makeStoredNote({ id: 'note-1', pending_create: false, title: 'Edited' }),
    );
    deps.local.outbox.push({ noteId: 'note-1', kind: 'upsert' });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(true);
    expect(deps.remote.updateNote).toHaveBeenCalledWith(
      'note-1',
      expect.objectContaining({ title: 'Edited' }),
    );
    expect(deps.remote.createNote).not.toHaveBeenCalled();
  });

  it('deletes a synced note on the remote store', async () => {
    // Arrange
    const deps = makeDeps();
    deps.local.notes.set(
      'note-1',
      makeStoredNote({
        id: 'note-1',
        pending_delete: true,
        pending_create: false,
      }),
    );
    deps.local.outbox.push({ noteId: 'note-1', kind: 'delete' });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(true);
    expect(deps.remote.deleteNote).toHaveBeenCalledWith('note-1');
    expect(deps.local.notes.has('note-1')).toBe(false);
  });

  it('skips remote delete for a note that was only created locally', async () => {
    // Arrange
    const deps = makeDeps();
    deps.local.notes.set(
      'note-1',
      makeStoredNote({
        id: 'note-1',
        pending_delete: true,
        pending_create: true,
      }),
    );
    deps.local.outbox.push({ noteId: 'note-1', kind: 'delete' });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(true);
    expect(deps.remote.deleteNote).not.toHaveBeenCalled();
    expect(deps.local.notes.has('note-1')).toBe(false);
  });

  it('drops stale delete outbox entries when the note is not pending delete', async () => {
    // Arrange
    const deps = makeDeps();
    deps.local.notes.set(
      'note-1',
      makeStoredNote({ id: 'note-1', pending_delete: false }),
    );
    deps.local.outbox.push({ noteId: 'note-1', kind: 'delete' });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(false);
    expect(deps.remote.deleteNote).not.toHaveBeenCalled();
    expect(deps.local.outbox).toHaveLength(0);
  });

  it('drops upsert outbox entries when the stored note is missing or pending delete', async () => {
    // Arrange
    const deps = makeDeps();
    deps.local.outbox.push({ noteId: 'missing', kind: 'upsert' });
    deps.local.notes.set(
      'deleted',
      makeStoredNote({ id: 'deleted', pending_delete: true }),
    );
    deps.local.outbox.push({ noteId: 'deleted', kind: 'upsert' });

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(false);
    expect(deps.remote.updateNote).not.toHaveBeenCalled();
    expect(deps.local.outbox).toHaveLength(0);
  });

  it('continues draining other notes when one remote upsert fails', async () => {
    // Arrange
    const deps = makeDeps({
      remote: {
        updateNote: vi.fn(async (noteId) => {
          if (noteId === 'fail') {
            throw new Error('remote failed');
          }
          return makeNote({ id: noteId });
        }),
      },
    });
    deps.local.notes.set('fail', makeStoredNote({ id: 'fail' }));
    deps.local.notes.set('ok', makeStoredNote({ id: 'ok' }));
    deps.local.outbox.push(
      { noteId: 'fail', kind: 'upsert' },
      { noteId: 'ok', kind: 'upsert' },
    );

    // Act
    const progressed = await drainOutbox('user-1', deps);

    // Assert
    expect(progressed).toBe(true);
    expect(deps.local.outbox.map((e) => e.noteId)).toEqual(['fail']);
    expect(deps.local.outbox).toHaveLength(1);
  });
});

describe('createOutboxDrainer', () => {
  it('coalesces concurrent drain calls', async () => {
    // Arrange
    let resolveRemote!: () => void;
    const remoteBlocked = new Promise<void>((r) => {
      resolveRemote = r;
    });
    const deps = makeDeps({
      remote: {
        updateNote: vi.fn(async () => {
          await remoteBlocked;
          return makeNote({ id: 'note-1' });
        }),
      },
    });
    deps.local.notes.set('note-1', makeStoredNote({ id: 'note-1' }));
    deps.local.outbox.push({ noteId: 'note-1', kind: 'upsert' });
    const drainer = createOutboxDrainer(deps);

    // Act
    const first = drainer.drain('user-1');
    const second = drainer.drain('user-1');
    resolveRemote();
    const [a, b] = await Promise.all([first, second]);

    // Assert
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(deps.remote.updateNote).toHaveBeenCalledTimes(1);
  });
});
