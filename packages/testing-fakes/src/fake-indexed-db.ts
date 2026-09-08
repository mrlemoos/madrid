/**
 * Minimal in-memory IndexedDB for specs that exercise the offline stores.
 *
 * Those packages test under `node`, and the stores are the thing under test,
 * so a hand-rolled double keeps the dependency graph flat.
 * It implements only what `db.ts` uses: `open`, `deleteDatabase`, versioned
 * upgrades, `get` / `getAll` / `put` / `delete`, and transaction completion.
 *
 * ponytail: covers the request shapes this package calls; add indexes/cursors
 * here if the store ever grows them.
 */

type Row = Record<string, unknown>;

export interface FakeRequest<T> {
  result: T | undefined;
  error: Error | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

function fakeRequest<T>(): FakeRequest<T> {
  return {
    result: undefined,
    error: null,
    onsuccess: null,
    onerror: null,
  };
}

/** Only the open request carries an upgrade callback. */
export interface FakeOpenRequest extends FakeRequest<FakeDatabase> {
  onupgradeneeded:
    | ((event: { target: { result: FakeDatabase } }) => void)
    | null;
}

export class FakeObjectStore {
  constructor(
    private readonly tx: FakeTransaction,
    private readonly rows: Map<string, Row>,
    private readonly keyPath: string,
  ) {}

  get(key: string): FakeRequest<Row | undefined> {
    return this.tx.request(() => this.rows.get(key));
  }

  getAll(): FakeRequest<Row[]> {
    return this.tx.request(() => [...this.rows.values()]);
  }

  put(row: Row): FakeRequest<string> {
    const key = String(row[this.keyPath]);
    return this.tx.request(() => {
      this.rows.set(key, row);
      return key;
    });
  }

  delete(key: string): FakeRequest<undefined> {
    return this.tx.request(() => {
      this.rows.delete(key);
      return undefined;
    });
  }
}

export class FakeTransaction {
  error: Error | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  private pending = 0;
  private complete: (() => void) | null = null;

  constructor(
    private readonly db: FakeDatabase,
    readonly mode: 'readonly' | 'readwrite',
  ) {}

  /** Assigned by `transactionComplete`; fires once every queued request settles. */
  set oncomplete(fn: (() => void) | null) {
    this.complete = fn;
    this.drain();
  }

  request<T>(run: () => T): FakeRequest<T> {
    const req = fakeRequest<T>();
    this.pending += 1;
    setTimeout(() => {
      try {
        req.result = run();
        req.onsuccess?.();
      } catch (error) {
        req.error = error as Error;
        req.onerror?.();
      }
      this.pending -= 1;
      this.drain();
    }, 0);
    return req;
  }

  objectStore(name: string): FakeObjectStore {
    const store = this.db.stores.get(name);
    if (!store) {
      throw new Error(`No object store named ${name}`);
    }
    return new FakeObjectStore(this, store.rows, store.keyPath);
  }

  private drain(): void {
    if (!this.complete) {
      return;
    }
    setTimeout(() => {
      if (this.pending > 0) {
        this.drain();
        return;
      }
      const fn = this.complete;
      this.complete = null;
      fn?.();
    }, 0);
  }
}

export class FakeDatabase {
  closed = false;
  version = 0;
  stores = new Map<string, { rows: Map<string, Row>; keyPath: string }>();

  get objectStoreNames() {
    const names = [...this.stores.keys()];
    return { contains: (name: string) => names.includes(name) };
  }

  createObjectStore(name: string, options: { keyPath: string }): void {
    this.stores.set(name, { rows: new Map(), keyPath: options.keyPath });
  }

  transaction(
    names: string | string[],
    mode: 'readonly' | 'readwrite' = 'readonly',
  ): FakeTransaction {
    if (this.closed) {
      throw new Error('Database is closed');
    }
    for (const name of Array.isArray(names) ? names : [names]) {
      if (!this.stores.has(name)) {
        throw new Error(`No object store named ${name}`);
      }
    }
    return new FakeTransaction(this, mode);
  }

  close(): void {
    this.closed = true;
  }
}

const databases = new Map<string, FakeDatabase>();

export const fakeIndexedDB = {
  open(name: string, version: number) {
    const req: FakeOpenRequest = {
      ...fakeRequest<FakeDatabase>(),
      onupgradeneeded: null,
    };
    setTimeout(() => {
      let db = databases.get(name);
      if (!db) {
        db = new FakeDatabase();
        databases.set(name, db);
      }
      db.closed = false;
      if (version > db.version) {
        db.version = version;
        req.onupgradeneeded?.({ target: { result: db } });
      }
      req.result = db;
      req.onsuccess?.();
    }, 0);
    return req;
  },
  deleteDatabase(name: string) {
    const req = fakeRequest<undefined>();
    setTimeout(() => {
      databases.delete(name);
      req.onsuccess?.();
    }, 0);
    return req;
  },
};

/** Drop every database between tests. */
export function resetFakeIndexedDb(): void {
  databases.clear();
}

/** Rows currently held by a store, for assertions that bypass the module. */
export function readFakeStore(dbName: string, storeName: string): Row[] {
  return [
    ...(databases.get(dbName)?.stores.get(storeName)?.rows.values() ?? []),
  ];
}
