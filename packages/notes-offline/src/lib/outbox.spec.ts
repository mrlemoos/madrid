import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fakeIndexedDB,
  resetFakeIndexedDb,
} from '@getmadrid/testing-fakes/indexed-db';
import { closeNotaNotesDb } from './db';
import {
  enqueueOutbox,
  listOutbox,
  removeOutboxEntry,
  sortOutboxForProcessing,
} from './outbox';

beforeEach(() => {
  resetFakeIndexedDb();
  closeNotaNotesDb();
  vi.stubGlobal('indexedDB', fakeIndexedDB);
});

afterEach(() => {
  closeNotaNotesDb();
  vi.unstubAllGlobals();
});

describe('enqueueOutbox', () => {
  it('queues a note for replay', async () => {
    // Arrange|Act
    await enqueueOutbox('user-1', 'note-1', 'upsert');

    // Assert
    await expect(listOutbox('user-1')).resolves.toEqual([
      { noteId: 'note-1', kind: 'upsert' },
    ]);
  });

  it('keeps one entry per note, with the latest intent winning', async () => {
    // Arrange
    await enqueueOutbox('user-1', 'note-1', 'upsert');

    // Act — the note was edited then deleted before the outbox drained
    await enqueueOutbox('user-1', 'note-1', 'delete');

    // Assert
    await expect(listOutbox('user-1')).resolves.toEqual([
      { noteId: 'note-1', kind: 'delete' },
    ]);
  });

  it('keeps each user’s queue to themselves', async () => {
    // Arrange
    await enqueueOutbox('user-1', 'note-1', 'upsert');

    // Act
    await enqueueOutbox('user-2', 'note-2', 'upsert');

    // Assert
    await expect(listOutbox('user-1')).resolves.toEqual([
      { noteId: 'note-1', kind: 'upsert' },
    ]);
  });
});

describe('removeOutboxEntry', () => {
  it('drops the entry once it has synced', async () => {
    // Arrange
    await enqueueOutbox('user-1', 'note-1', 'upsert');

    // Act
    await removeOutboxEntry('user-1', 'note-1');

    // Assert
    await expect(listOutbox('user-1')).resolves.toEqual([]);
  });

  it('is a no-op for a note that was never queued', async () => {
    // Arrange|Act|Assert
    await expect(
      removeOutboxEntry('user-1', 'never-queued'),
    ).resolves.toBeUndefined();
  });
});

describe('listOutbox', () => {
  it('is empty for a vault that has never gone offline', async () => {
    // Arrange|Act|Assert
    await expect(listOutbox('user-1')).resolves.toEqual([]);
  });
});

describe('sortOutboxForProcessing', () => {
  it('is re-exported so callers need only this module', () => {
    // Arrange|Act|Assert
    expect(typeof sortOutboxForProcessing).toBe('function');
  });
});
