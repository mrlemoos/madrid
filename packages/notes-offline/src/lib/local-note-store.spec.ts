import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';
import { DEFAULT_NOTE_CONTENT } from '@getmadrid/notes-offline-core';

import {
  fakeIndexedDB,
  resetFakeIndexedDb,
} from '../../../../tools/testing/fake-indexed-db';
import { closeNotaNotesDb } from './db';
import {
  createLocalOnlyNote,
  getStoredNote,
  listStoredNotes,
  markNoteSyncedFromServer,
  markPendingDelete,
  putServerNoteIfNotDirty,
  removeStoredNote,
  saveLocalNoteDraft,
} from './local-note-store';
import { listOutbox } from './outbox';

function serverNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    user_id: 'user-1',
    title: 'From the server',
    content: DEFAULT_NOTE_CONTENT,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-03-04T10:00:00.000Z',
    due_at: null,
    is_deadline: false,
    editor_settings: {},
    banner_attachment_id: null,
    folder_id: null,
    share_token: null,
    ...overrides,
  } as Note;
}

beforeEach(() => {
  resetFakeIndexedDb();
  closeNotaNotesDb();
  vi.stubGlobal('indexedDB', fakeIndexedDB);
});

afterEach(() => {
  closeNotaNotesDb();
  vi.unstubAllGlobals();
});

describe('putServerNoteIfNotDirty', () => {
  it('stores the server snapshot as clean', async () => {
    // Arrange|Act
    await putServerNoteIfNotDirty('user-1', serverNote());

    // Assert
    const stored = await getStoredNote('user-1', 'note-1');
    expect(stored).toMatchObject({
      title: 'From the server',
      dirty: false,
      pending_create: false,
      pending_delete: false,
      server_updated_at: '2026-03-04T10:00:00.000Z',
    });
  });

  it('leaves an unsynced local edit alone', async () => {
    // Arrange
    await saveLocalNoteDraft('user-1', { id: 'note-1', title: 'My edit' });

    // Act
    await putServerNoteIfNotDirty('user-1', serverNote());

    // Assert — the server row must not clobber typing that has not synced
    const stored = await getStoredNote('user-1', 'note-1');
    expect(stored?.title).toBe('My edit');
    expect(stored?.dirty).toBe(true);
  });
});

describe('saveLocalNoteDraft', () => {
  it('marks the note dirty and queues it for replay', async () => {
    // Arrange|Act
    await saveLocalNoteDraft('user-1', { id: 'note-1', title: 'Draft' });

    // Assert
    const stored = await getStoredNote('user-1', 'note-1');
    expect(stored).toMatchObject({
      title: 'Draft',
      user_id: 'user-1',
      dirty: true,
      pending_delete: false,
    });
    await expect(listOutbox('user-1')).resolves.toEqual([
      { noteId: 'note-1', kind: 'upsert' },
    ]);
  });

  it('keeps fields the patch does not mention', async () => {
    // Arrange
    await saveLocalNoteDraft('user-1', {
      id: 'note-1',
      title: 'Draft',
      folder_id: 'folder-1',
      is_deadline: true,
    });

    // Act — a body-only autosave
    await saveLocalNoteDraft('user-1', {
      id: 'note-1',
      content: { type: 'doc', content: [] },
    });

    // Assert
    const stored = await getStoredNote('user-1', 'note-1');
    expect(stored).toMatchObject({
      title: 'Draft',
      folder_id: 'folder-1',
      is_deadline: true,
    });
  });

  it('can clear a nullable field explicitly', async () => {
    // Arrange
    await saveLocalNoteDraft('user-1', { id: 'note-1', folder_id: 'folder-1' });

    // Act — moving a note back to the root
    await saveLocalNoteDraft('user-1', { id: 'note-1', folder_id: null });

    // Assert
    expect((await getStoredNote('user-1', 'note-1'))?.folder_id).toBeNull();
  });

  it('starts a brand-new note from the empty document', async () => {
    // Arrange|Act
    await saveLocalNoteDraft('user-1', { id: 'note-1' });

    // Assert
    const stored = await getStoredNote('user-1', 'note-1');
    expect(stored?.content).toEqual(DEFAULT_NOTE_CONTENT);
    expect(stored?.title).toBe('');
  });

  it('flags a note the server has never seen', async () => {
    // Arrange|Act
    await saveLocalNoteDraft(
      'user-1',
      { id: 'note-1', title: 'Offline' },
      { pendingCreate: true },
    );

    // Assert
    expect((await getStoredNote('user-1', 'note-1'))?.pending_create).toBe(
      true,
    );
  });
});

describe('getStoredNote', () => {
  it('is null for a note this vault has never held', async () => {
    // Arrange|Act|Assert
    await expect(getStoredNote('user-1', 'missing')).resolves.toBeNull();
  });
});

describe('listStoredNotes', () => {
  it('returns everything cached for the user', async () => {
    // Arrange
    await saveLocalNoteDraft('user-1', { id: 'note-1', title: 'One' });
    await saveLocalNoteDraft('user-1', { id: 'note-2', title: 'Two' });

    // Act
    const rows = await listStoredNotes('user-1');

    // Assert
    expect(rows.map((r) => r.id).sort()).toEqual(['note-1', 'note-2']);
  });
});

describe('markNoteSyncedFromServer', () => {
  it('clears the dirty flags and empties the outbox entry', async () => {
    // Arrange
    await saveLocalNoteDraft('user-1', { id: 'note-1', title: 'Draft' });

    // Act
    await markNoteSyncedFromServer('user-1', serverNote({ title: 'Draft' }));

    // Assert
    expect(await getStoredNote('user-1', 'note-1')).toMatchObject({
      dirty: false,
      pending_create: false,
      pending_delete: false,
      server_updated_at: '2026-03-04T10:00:00.000Z',
    });
    await expect(listOutbox('user-1')).resolves.toEqual([]);
  });
});

describe('markPendingDelete', () => {
  it('drops a never-synced note outright instead of queueing a delete', async () => {
    // Arrange
    const id = await createLocalOnlyNote('user-1', 'Offline note');

    // Act
    await markPendingDelete('user-1', id, false);

    // Assert — the server has nothing to delete
    await expect(getStoredNote('user-1', id)).resolves.toBeNull();
    await expect(listOutbox('user-1')).resolves.toEqual([]);
  });

  it('tombstones a synced note and queues the delete', async () => {
    // Arrange
    await putServerNoteIfNotDirty('user-1', serverNote());

    // Act
    await markPendingDelete('user-1', 'note-1', true);

    // Assert
    expect(await getStoredNote('user-1', 'note-1')).toMatchObject({
      pending_delete: true,
      dirty: true,
    });
    await expect(listOutbox('user-1')).resolves.toEqual([
      { noteId: 'note-1', kind: 'delete' },
    ]);
  });

  it('records a tombstone even for a note this device never cached', async () => {
    // Arrange|Act — deleted from the palette while the note was never opened
    await markPendingDelete('user-1', 'note-elsewhere', true);

    // Assert
    expect(await getStoredNote('user-1', 'note-elsewhere')).toMatchObject({
      user_id: 'user-1',
      pending_delete: true,
      dirty: true,
    });
    await expect(listOutbox('user-1')).resolves.toEqual([
      { noteId: 'note-elsewhere', kind: 'delete' },
    ]);
  });
});

describe('createLocalOnlyNote', () => {
  it('creates a pending note with a client-assigned id', async () => {
    // Arrange|Act
    const id = await createLocalOnlyNote('user-1');

    // Assert
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(await getStoredNote('user-1', id)).toMatchObject({
      title: 'Untitled Note',
      content: DEFAULT_NOTE_CONTENT,
      folder_id: null,
      dirty: true,
      pending_create: true,
    });
  });

  it('takes the title and folder the caller chose', async () => {
    // Arrange|Act
    const id = await createLocalOnlyNote(
      'user-1',
      '4 March 2026',
      { type: 'doc', content: [] },
      'folder-1',
    );

    // Assert
    expect(await getStoredNote('user-1', id)).toMatchObject({
      title: '4 March 2026',
      folder_id: 'folder-1',
    });
  });

  it('queues the new note for replay', async () => {
    // Arrange|Act
    const id = await createLocalOnlyNote('user-1');

    // Assert
    await expect(listOutbox('user-1')).resolves.toEqual([
      { noteId: id, kind: 'upsert' },
    ]);
  });
});

describe('removeStoredNote', () => {
  it('forgets the note and its queued work', async () => {
    // Arrange
    const id = await createLocalOnlyNote('user-1');

    // Act
    await removeStoredNote('user-1', id);

    // Assert
    await expect(getStoredNote('user-1', id)).resolves.toBeNull();
    await expect(listOutbox('user-1')).resolves.toEqual([]);
  });
});
