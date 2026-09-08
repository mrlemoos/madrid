import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import { DEFAULT_COMPACTION_THRESHOLD } from '@getmadrid/notes-yjs-core';

import { SupabaseYjsProvider } from './supabase-yjs-provider';
import { uint8ToBase64 } from './yjs-base64';

type Row = { seq: number; update: string };

/**
 * Supabase double: a `note_yjs_updates` log that records inserts and deletes,
 * plus a Realtime channel whose INSERT handler can be fired by the test.
 */
function makeClient(rows: Row[] = [], selectError: unknown = null) {
  const inserts: {
    note_id: string;
    update: string;
    actor: string;
    is_snapshot: boolean;
  }[] = [];
  const deletes: { note_id?: string; upto?: number }[] = [];
  let handler: ((payload: { new: Row }) => void) | null = null;
  const channelHandle = { id: 'channel' };
  const removeChannel = vi.fn();
  const insertError = { current: null as unknown };

  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: rows, error: selectError }),
        }),
      }),
      insert: (row: (typeof inserts)[number]) => {
        inserts.push(row);
        return Promise.resolve({ error: insertError.current });
      },
      delete: () => {
        const record: { note_id?: string; upto?: number } = {};
        deletes.push(record);
        return {
          eq: (_col: string, value: string) => {
            record.note_id = value;
            return {
              lte: (_seqCol: string, seq: number) => {
                record.upto = seq;
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      },
    }),
    channel: vi.fn(() => ({
      on: (
        _event: string,
        _filter: unknown,
        fn: (payload: { new: Row }) => void,
      ) => {
        handler = fn;
        return { subscribe: () => channelHandle };
      },
    })),
    removeChannel,
  };

  return {
    client: client as never,
    inserts,
    deletes,
    removeChannel,
    channelHandle,
    insertError,
    emitRemote: (row: Row) => handler?.({ new: row }),
    channelName: () => client.channel.mock.calls[0]?.[0] as string,
  };
}

/** One row holding the whole state of a doc with the given text. */
function rowFor(seq: number, text: string): Row {
  const doc = new Y.Doc();
  doc.getText('body').insert(0, text);
  return { seq, update: uint8ToBase64(Y.encodeStateAsUpdate(doc)) };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SupabaseYjsProvider.connect', () => {
  it('subscribes to the note’s own realtime channel', async () => {
    // Arrange
    const supabase = makeClient();
    const doc = new Y.Doc();

    // Act
    await new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();

    // Assert
    expect(supabase.channelName()).toBe('note-yjs:note-1');
  });

  it('folds the stored log into the doc', async () => {
    // Arrange
    const supabase = makeClient([rowFor(1, 'hello')]);
    const doc = new Y.Doc();

    // Act
    await new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();

    // Assert
    expect(doc.getText('body').toString()).toBe('hello');
  });

  it('writes no row when the server already has everything', async () => {
    // Arrange
    const supabase = makeClient([rowFor(1, 'hello')]);
    const doc = new Y.Doc();

    // Act
    await new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();

    // Assert — an empty delta would add a useless row on every reconnect
    expect(supabase.inserts).toEqual([]);
  });

  it('flushes edits authored offline as one delta row', async () => {
    // Arrange
    const supabase = makeClient([rowFor(1, 'hello')]);
    const doc = new Y.Doc();
    doc.getText('body').insert(0, 'offline ');

    // Act
    await new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();

    // Assert
    expect(supabase.inserts).toHaveLength(1);
    expect(supabase.inserts[0]).toMatchObject({
      note_id: 'note-1',
      actor: 'user-1',
      is_snapshot: false,
    });
  });

  it('raises a failed log read rather than starting from an empty doc', async () => {
    // Arrange
    const supabase = makeClient([], new Error('rls'));
    const doc = new Y.Doc();

    // Act|Assert
    await expect(
      new SupabaseYjsProvider(doc, {
        client: supabase.client,
        noteId: 'note-1',
        actor: 'user-1',
      }).connect(),
    ).rejects.toThrow('rls');
  });
});

describe('SupabaseYjsProvider live edits', () => {
  it('pushes a local edit to the log', async () => {
    // Arrange
    const supabase = makeClient();
    const doc = new Y.Doc();
    const provider = new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    });
    await provider.connect();
    supabase.inserts.length = 0;

    // Act
    doc.getText('body').insert(0, 'typed');

    // Assert
    expect(supabase.inserts).toHaveLength(1);
    expect(supabase.inserts[0]?.is_snapshot).toBe(false);
  });

  it('applies a remote edit without echoing it back', async () => {
    // Arrange
    const supabase = makeClient();
    const doc = new Y.Doc();
    await new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();
    supabase.inserts.length = 0;

    // Act
    supabase.emitRemote(rowFor(2, 'from elsewhere'));

    // Assert — echoing would loop the two clients forever
    expect(doc.getText('body').toString()).toBe('from elsewhere');
    expect(supabase.inserts).toEqual([]);
  });

  it('keeps the edit locally when the push fails', async () => {
    // Arrange
    const supabase = makeClient();
    const doc = new Y.Doc();
    await new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();
    supabase.insertError.current = new Error('offline');

    // Act
    doc.getText('body').insert(0, 'typed');
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    // Assert — IndexedDB still holds it; reconnect re-pushes it
    expect(doc.getText('body').toString()).toBe('typed');
  });
});

describe('SupabaseYjsProvider compaction', () => {
  it('leaves a short log alone', async () => {
    // Arrange
    const supabase = makeClient([rowFor(1, 'a')]);

    // Act
    await new SupabaseYjsProvider(new Y.Doc(), {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();

    // Assert
    expect(supabase.deletes).toEqual([]);
  });

  it('folds a long log into one snapshot and prunes what it covers', async () => {
    // Arrange
    const rows = Array.from(
      { length: DEFAULT_COMPACTION_THRESHOLD + 1 },
      (_, i) => rowFor(i + 1, String(i)),
    );
    const supabase = makeClient(rows);

    // Act
    await new SupabaseYjsProvider(new Y.Doc(), {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();

    // Assert — prune only up to the seq seen before the snapshot
    expect(supabase.inserts.some((row) => row.is_snapshot)).toBe(true);
    expect(supabase.deletes).toEqual([
      { note_id: 'note-1', upto: rows[rows.length - 1]?.seq },
    ]);
  });

  it('leaves the log intact when the snapshot cannot be written', async () => {
    // Arrange
    const rows = Array.from(
      { length: DEFAULT_COMPACTION_THRESHOLD + 1 },
      (_, i) => rowFor(i + 1, String(i)),
    );
    const supabase = makeClient(rows);
    supabase.insertError.current = new Error('offline');

    // Act
    await new SupabaseYjsProvider(new Y.Doc(), {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    }).connect();

    // Assert — pruning without a snapshot would lose the document
    expect(supabase.deletes).toEqual([]);
  });
});

describe('SupabaseYjsProvider.destroy', () => {
  it('stops pushing local edits and drops the channel', async () => {
    // Arrange
    const supabase = makeClient();
    const doc = new Y.Doc();
    const provider = new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    });
    await provider.connect();

    // Act
    provider.destroy();
    doc.getText('body').insert(0, 'after close');

    // Assert
    expect(supabase.inserts).toEqual([]);
    expect(supabase.removeChannel).toHaveBeenCalledWith(supabase.channelHandle);
  });

  it('ignores a remote edit that lands after teardown', async () => {
    // Arrange
    const supabase = makeClient();
    const doc = new Y.Doc();
    const provider = new SupabaseYjsProvider(doc, {
      client: supabase.client,
      noteId: 'note-1',
      actor: 'user-1',
    });
    await provider.connect();
    provider.destroy();

    // Act
    supabase.emitRemote(rowFor(2, 'late'));

    // Assert
    expect(doc.getText('body').toString()).toBe('');
  });
});
