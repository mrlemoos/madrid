import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fakeIndexedDB,
  readFakeStore,
  resetFakeIndexedDb,
  type FakeDatabase,
  type FakeRequest,
  type FakeTransaction,
} from './fake-indexed-db';

/** Promise wrappers matching how the offline stores drive real IndexedDB. */
function request<T>(req: FakeRequest<T>): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error ?? new Error('request failed'));
    };
  });
}

function complete(tx: FakeTransaction): Promise<void> {
  return new Promise((resolve) => {
    tx.oncomplete = () => {
      resolve();
    };
  });
}

async function openDb(name = 'vault'): Promise<FakeDatabase> {
  const req = fakeIndexedDB.open(name, 1);
  req.onupgradeneeded = (event) => {
    event.target.result.createObjectStore('notes', { keyPath: 'id' });
  };
  const db = await request(req);
  if (!db) {
    throw new Error('no database');
  }
  return db;
}

beforeEach(() => {
  resetFakeIndexedDb();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('fakeIndexedDB.open', () => {
  it('runs the upgrade only the first time a database is opened', async () => {
    // Arrange
    const upgrade = vi.fn();

    // Act
    await openDb();
    const reopen = fakeIndexedDB.open('vault', 1);
    reopen.onupgradeneeded = upgrade;
    await request(reopen);

    // Assert
    expect(upgrade).not.toHaveBeenCalled();
  });

  it('reports the stores that were created', async () => {
    // Arrange|Act
    const db = await openDb();

    // Assert
    expect(db.objectStoreNames.contains('notes')).toBe(true);
    expect(db.objectStoreNames.contains('outbox')).toBe(false);
  });

  it('keeps each database separate', async () => {
    // Arrange|Act
    const first = await openDb('vault-a');
    const second = await openDb('vault-b');

    // Assert
    expect(second).not.toBe(first);
  });

  it('reopens a closed database', async () => {
    // Arrange
    const db = await openDb();
    db.close();

    // Act
    const reopened = await openDb();

    // Assert
    expect(() => reopened.transaction('notes', 'readwrite')).not.toThrow();
  });
});

describe('fake transactions', () => {
  it('stores and reads a row back by its key path', async () => {
    // Arrange
    const db = await openDb();

    // Act
    const write = db.transaction('notes', 'readwrite');
    write.objectStore('notes').put({ id: 'note-1', title: 'Quiet' });
    await complete(write);
    const read = db.transaction('notes', 'readonly');
    const row = await request(read.objectStore('notes').get('note-1'));
    await complete(read);

    // Assert
    expect(row).toEqual({ id: 'note-1', title: 'Quiet' });
  });

  it('replaces a row with the same key', async () => {
    // Arrange
    const db = await openDb();

    // Act
    for (const title of ['First', 'Second']) {
      const tx = db.transaction('notes', 'readwrite');
      tx.objectStore('notes').put({ id: 'note-1', title });
      await complete(tx);
    }

    // Assert
    expect(readFakeStore('vault', 'notes')).toEqual([
      { id: 'note-1', title: 'Second' },
    ]);
  });

  it('lists and deletes rows', async () => {
    // Arrange
    const db = await openDb();
    const seed = db.transaction('notes', 'readwrite');
    seed.objectStore('notes').put({ id: 'note-1' });
    seed.objectStore('notes').put({ id: 'note-2' });
    await complete(seed);

    // Act
    const remove = db.transaction('notes', 'readwrite');
    remove.objectStore('notes').delete('note-1');
    await complete(remove);
    const read = db.transaction('notes', 'readonly');
    const rows = await request(read.objectStore('notes').getAll());
    await complete(read);

    // Assert
    expect(rows).toEqual([{ id: 'note-2' }]);
  });

  it('completes only after every queued request has settled', async () => {
    // Arrange
    const db = await openDb();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');

    // Act — the stores read, then write, then wait, inside one transaction
    const read = request(store.get('note-1'));
    store.put({ id: 'note-1' });
    await complete(tx);

    // Assert
    await expect(read).resolves.toBeUndefined();
    expect(readFakeStore('vault', 'notes')).toEqual([{ id: 'note-1' }]);
  });

  it('refuses a transaction on a closed database', async () => {
    // Arrange
    const db = await openDb();

    // Act
    db.close();

    // Assert
    expect(() => db.transaction('notes', 'readwrite')).toThrow(
      'Database is closed',
    );
  });

  it('refuses a store that was never created', async () => {
    // Arrange
    const db = await openDb();

    // Act|Assert
    expect(() => db.transaction('outbox').objectStore('outbox')).toThrow(
      'No object store named outbox',
    );
  });
});

describe('fakeIndexedDB.deleteDatabase', () => {
  it('throws the stored rows away', async () => {
    // Arrange
    const db = await openDb();
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').put({ id: 'note-1' });
    await complete(tx);

    // Act
    await request(fakeIndexedDB.deleteDatabase('vault'));

    // Assert
    expect(readFakeStore('vault', 'notes')).toEqual([]);
  });
});

describe('resetFakeIndexedDb', () => {
  it('leaves nothing behind between tests', async () => {
    // Arrange
    const db = await openDb();
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').put({ id: 'note-1' });
    await complete(tx);

    // Act
    resetFakeIndexedDb();

    // Assert
    expect(readFakeStore('vault', 'notes')).toEqual([]);
  });
});
