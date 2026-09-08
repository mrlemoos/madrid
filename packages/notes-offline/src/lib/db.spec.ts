import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fakeIndexedDB,
  resetFakeIndexedDb,
} from '../../../../tools/testing/fake-indexed-db';
import {
  closeNotaNotesDb,
  deleteNotaNotesDb,
  getNotaNotesDb,
  idbRequest,
  NOTES_OBJECT_STORE,
  openNotaNotesDb,
  transactionComplete,
} from './db';

beforeEach(() => {
  resetFakeIndexedDb();
  closeNotaNotesDb();
  vi.stubGlobal('indexedDB', fakeIndexedDB);
});

afterEach(() => {
  closeNotaNotesDb();
  vi.unstubAllGlobals();
});

describe('openNotaNotesDb', () => {
  it('creates both object stores on first open', async () => {
    // Arrange|Act
    const db = await openNotaNotesDb('user-1');

    // Assert
    expect(db.objectStoreNames.contains('notes')).toBe(true);
    expect(db.objectStoreNames.contains('outbox')).toBe(true);
  });

  it('gives each user their own database', async () => {
    // Arrange|Act
    const first = await openNotaNotesDb('user-1');
    const second = await openNotaNotesDb('user-2');

    // Assert — one signed-in user must never read another's vault
    expect(second).not.toBe(first);
  });
});

describe('getNotaNotesDb', () => {
  it('refuses to work where IndexedDB is unavailable', async () => {
    // Arrange
    vi.stubGlobal('indexedDB', undefined);

    // Act|Assert
    await expect(getNotaNotesDb('user-1')).rejects.toThrow(
      'IndexedDB is not available',
    );
  });

  it('reuses the open handle for the same user', async () => {
    // Arrange|Act
    const first = await getNotaNotesDb('user-1');
    const second = await getNotaNotesDb('user-1');

    // Assert
    expect(second).toBe(first);
  });

  it('closes the previous handle when the signed-in user changes', async () => {
    // Arrange
    const first = await getNotaNotesDb('user-1');
    const close = vi.spyOn(first, 'close');

    // Act
    const second = await getNotaNotesDb('user-2');

    // Assert
    expect(close).toHaveBeenCalled();
    expect(second).not.toBe(first);
  });
});

describe('closeNotaNotesDb', () => {
  it('drops the cached handle so the next call reopens', async () => {
    // Arrange
    const first = await getNotaNotesDb('user-1');

    // Act
    closeNotaNotesDb();
    const second = await getNotaNotesDb('user-1');

    // Assert — same underlying database, freshly opened
    expect(first).toBe(second);
    expect(second.objectStoreNames.contains('notes')).toBe(true);
  });

  it('is safe to call when nothing is open', () => {
    // Arrange|Act|Assert
    expect(() => {
      closeNotaNotesDb();
    }).not.toThrow();
  });
});

describe('deleteNotaNotesDb', () => {
  it('throws the user’s vault away', async () => {
    // Arrange
    const db = await getNotaNotesDb('user-1');
    const tx = db.transaction(NOTES_OBJECT_STORE, 'readwrite');
    tx.objectStore(NOTES_OBJECT_STORE).put({ id: 'note-1' });
    await transactionComplete(tx);

    // Act
    await deleteNotaNotesDb('user-1');

    // Assert
    const reopened = await getNotaNotesDb('user-1');
    const readTx = reopened.transaction(NOTES_OBJECT_STORE, 'readonly');
    const rows = await idbRequest(
      readTx.objectStore(NOTES_OBJECT_STORE).getAll(),
    );
    expect(rows).toEqual([]);
  });
});

describe('idbRequest', () => {
  it('resolves with the request result', async () => {
    // Arrange
    const db = await getNotaNotesDb('user-1');
    const tx = db.transaction(NOTES_OBJECT_STORE, 'readwrite');
    const store = tx.objectStore(NOTES_OBJECT_STORE);
    store.put({ id: 'note-1', title: 'Quiet' });

    // Act
    const row = await idbRequest(store.get('note-1'));

    // Assert
    expect(row).toEqual({ id: 'note-1', title: 'Quiet' });
  });

  it('rejects with the request error', async () => {
    // Arrange
    const req = {
      error: new Error('quota exceeded'),
      onsuccess: null,
      onerror: null,
    } as unknown as IDBRequest<unknown>;
    const promise = idbRequest(req);

    // Act
    (req as unknown as { onerror: () => void }).onerror();

    // Assert
    await expect(promise).rejects.toThrow('quota exceeded');
  });
});

describe('transactionComplete', () => {
  it('rejects when the transaction fails', async () => {
    // Arrange
    const tx = {
      error: new Error('write failed'),
      oncomplete: null,
      onerror: null,
      onabort: null,
    } as unknown as IDBTransaction;
    const promise = transactionComplete(tx);

    // Act
    (tx as unknown as { onerror: () => void }).onerror();

    // Assert
    await expect(promise).rejects.toThrow('write failed');
  });

  it('rejects when the transaction aborts', async () => {
    // Arrange
    const tx = {
      error: null,
      oncomplete: null,
      onerror: null,
      onabort: null,
    } as unknown as IDBTransaction;
    const promise = transactionComplete(tx);

    // Act
    (tx as unknown as { onabort: () => void }).onabort();

    // Assert
    await expect(promise).rejects.toThrow('IndexedDB transaction aborted');
  });
});
