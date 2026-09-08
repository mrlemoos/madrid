import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const embedTextForSemanticSearch = vi.fn();

vi.mock('./semantic-embeddings.server', () => ({
  embedTextForSemanticSearch,
}));

const {
  buildSearchDocument,
  hashSearchDocument,
  reindexAllSemanticNotes,
  semanticSearchNotes,
  upsertSemanticIndexForNote,
} = await import('./semantic-search-ops.server');

type Row = Record<string, unknown>;

/**
 * Supabase double keyed by table, with a recorded `upsert` and a stubbed RPC.
 * Each builder resolves whatever the table was seeded with.
 */
function makeSupabase(
  options: {
    tables?: Record<
      string,
      { data?: Row[] | Row | null; error?: { message: string } }
    >;
    rpc?: { data?: unknown; error?: { message: string } };
  } = {},
) {
  const upserts: Row[] = [];
  const rpc = vi.fn().mockResolvedValue({
    data: options.rpc?.data ?? [],
    error: options.rpc?.error ?? null,
  });

  function builderFor(table: string) {
    const seeded = options.tables?.[table] ?? { data: [] };
    const result = { data: seeded.data ?? [], error: seeded.error ?? null };
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      maybeSingle: () =>
        Promise.resolve({
          data: Array.isArray(result.data)
            ? (result.data[0] ?? null)
            : result.data,
          error: result.error,
        }),
      upsert: (row: Row) => {
        upserts.push(row);
        return Promise.resolve({ error: seeded.error ?? null });
      },
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
    };
    return chain;
  }

  return {
    supabase: {
      from: (table: string) => builderFor(table),
      rpc,
    } as unknown as SupabaseClient,
    upserts,
    rpc,
  };
}

function doc(text: string) {
  return { type: 'doc', content: [{ type: 'text', text }] };
}

beforeEach(() => {
  vi.clearAllMocks();
  embedTextForSemanticSearch.mockResolvedValue([0.1, 0.2]);
});

describe('buildSearchDocument', () => {
  it('puts the title above the body', () => {
    // Arrange|Act
    const document = buildSearchDocument({
      title: '  Boarding pass  ',
      contentJson: doc('Gate 14'),
    });

    // Assert
    expect(document).toBe('Boarding pass\n\nGate 14');
  });

  it('is just the title for an empty note', () => {
    // Arrange|Act|Assert
    expect(
      buildSearchDocument({ title: 'Empty', contentJson: { type: 'doc' } }),
    ).toBe('Empty');
  });

  it('truncates a very long note and marks where it was cut', () => {
    // Arrange|Act
    const document = buildSearchDocument({
      title: 'Long',
      contentJson: doc('x'.repeat(20_000)),
    });

    // Assert — the embeddings API has an input limit
    expect(document.length).toBe(12_002);
    expect(document.endsWith('\n…')).toBe(true);
  });
});

describe('hashSearchDocument', () => {
  it('is stable for the same document and differs for a changed one', () => {
    // Arrange|Act|Assert
    expect(hashSearchDocument('a')).toBe(hashSearchDocument('a'));
    expect(hashSearchDocument('a')).not.toBe(hashSearchDocument('b'));
    expect(hashSearchDocument('a')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('semanticSearchNotes', () => {
  it('returns nothing for an empty query, without embedding it', async () => {
    // Arrange
    const { supabase } = makeSupabase();

    // Act
    const result = await semanticSearchNotes({
      supabase,
      userId: 'user-1',
      query: '   ',
    });

    // Assert
    expect(result).toEqual({ results: [] });
    expect(embedTextForSemanticSearch).not.toHaveBeenCalled();
  });

  it('answers a quoted-only query by scanning the notes, with no embedding', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      tables: {
        notes: {
          data: [
            { id: 'note-1', title: 'Boarding pass', content: doc('Gate 14') },
            { id: 'note-2', title: 'Other', content: doc('nothing') },
          ],
        },
      },
    });

    // Act
    const result = await semanticSearchNotes({
      supabase,
      userId: 'user-1',
      query: '"Gate 14"',
    });

    // Assert
    expect(embedTextForSemanticSearch).not.toHaveBeenCalled();
    expect(result.results).toEqual([{ noteId: 'note-1' }]);
  });

  it('matches literals case-insensitively across title and body', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      tables: {
        notes: {
          data: [
            { id: 'note-1', title: 'Boarding Pass', content: doc('Gate 14') },
          ],
        },
      },
    });

    // Act
    const result = await semanticSearchNotes({
      supabase,
      userId: 'user-1',
      query: '"boarding pass" "gate 14"',
    });

    // Assert
    expect(result.results).toEqual([{ noteId: 'note-1' }]);
  });

  it('ranks by the vector distance the database returned', async () => {
    // Arrange
    const { supabase, rpc } = makeSupabase({
      rpc: {
        data: [
          { note_id: 'note-1', distance: 0.1 },
          { note_id: 'note-2', distance: 0.4 },
        ],
      },
    });

    // Act
    const result = await semanticSearchNotes({
      supabase,
      userId: 'user-1',
      query: 'travel plans',
    });

    // Assert
    expect(rpc).toHaveBeenCalledWith('match_note_semantic_index', {
      p_user_id: 'user-1',
      p_query_embedding: '[0.1,0.2]',
      p_match_count: 120,
    });
    expect(result.results).toEqual([
      { noteId: 'note-1', distance: 0.1 },
      { noteId: 'note-2', distance: 0.4 },
    ]);
  });

  it('keeps only the ranked notes that also contain the literals', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      rpc: {
        data: [
          { note_id: 'note-1', distance: 0.1 },
          { note_id: 'note-2', distance: 0.2 },
        ],
      },
      tables: {
        note_semantic_index: {
          data: [
            { note_id: 'note-1', search_document: 'Boarding pass Gate 14' },
            { note_id: 'note-2', search_document: 'Something else' },
          ],
        },
      },
    });

    // Act
    const result = await semanticSearchNotes({
      supabase,
      userId: 'user-1',
      query: 'travel "Gate 14"',
    });

    // Assert
    expect(result.results).toEqual([{ noteId: 'note-1', distance: 0.1 }]);
  });

  it('reports a failed literal scan', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      tables: { notes: { data: [], error: { message: 'rls' } } },
    });

    // Act|Assert
    await expect(
      semanticSearchNotes({ supabase, userId: 'user-1', query: '"gate"' }),
    ).rejects.toThrow('semantic search literal query failed: rls');
  });

  it('reports a failed vector search', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      rpc: { error: { message: 'no index' } },
    });

    // Act|Assert
    await expect(
      semanticSearchNotes({ supabase, userId: 'user-1', query: 'travel' }),
    ).rejects.toThrow('semantic rpc failed: no index');
  });
});

describe('upsertSemanticIndexForNote', () => {
  it('embeds the note and stores the vector with its hash', async () => {
    // Arrange
    const { supabase, upserts } = makeSupabase({
      tables: {
        notes: {
          data: [
            {
              id: 'note-1',
              user_id: 'user-1',
              title: 'Boarding pass',
              content: doc('Gate 14'),
            },
          ],
        },
        note_semantic_index: { data: [] },
      },
    });

    // Act
    const result = await upsertSemanticIndexForNote({
      supabase,
      userId: 'user-1',
      noteId: 'note-1',
    });

    // Assert
    expect(result).toEqual({ skipped: false });
    expect(upserts[0]).toMatchObject({
      note_id: 'note-1',
      user_id: 'user-1',
      embedding: '[0.1,0.2]',
      search_document: 'Boarding pass\n\nGate 14',
    });
  });

  it('skips a note whose text has not changed', async () => {
    // Arrange
    const searchDocument = buildSearchDocument({
      title: 'Boarding pass',
      contentJson: doc('Gate 14'),
    });
    const { supabase, upserts } = makeSupabase({
      tables: {
        notes: {
          data: [
            {
              id: 'note-1',
              user_id: 'user-1',
              title: 'Boarding pass',
              content: doc('Gate 14'),
            },
          ],
        },
        note_semantic_index: {
          data: [{ content_hash: hashSearchDocument(searchDocument) }],
        },
      },
    });

    // Act
    const result = await upsertSemanticIndexForNote({
      supabase,
      userId: 'user-1',
      noteId: 'note-1',
    });

    // Assert — re-embedding unchanged notes costs money for nothing
    expect(result).toEqual({ skipped: true });
    expect(embedTextForSemanticSearch).not.toHaveBeenCalled();
    expect(upserts).toEqual([]);
  });

  it('refuses to index another account’s note', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      tables: {
        notes: {
          data: [
            {
              id: 'note-1',
              user_id: 'someone-else',
              title: 'x',
              content: doc('y'),
            },
          ],
        },
      },
    });

    // Act|Assert
    await expect(
      upsertSemanticIndexForNote({
        supabase,
        userId: 'user-1',
        noteId: 'note-1',
      }),
    ).rejects.toThrow('Note not found');
  });

  it('reports a note that does not exist', async () => {
    // Arrange
    const { supabase } = makeSupabase({ tables: { notes: { data: [] } } });

    // Act|Assert
    await expect(
      upsertSemanticIndexForNote({
        supabase,
        userId: 'user-1',
        noteId: 'missing',
      }),
    ).rejects.toThrow('Note not found');
  });
});

describe('reindexAllSemanticNotes', () => {
  it('counts every note it walked', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      tables: {
        notes: {
          data: [
            {
              id: 'note-1',
              user_id: 'user-1',
              title: 'One',
              content: doc('a'),
            },
            {
              id: 'note-2',
              user_id: 'user-1',
              title: 'Two',
              content: doc('b'),
            },
          ],
        },
        note_semantic_index: { data: [] },
      },
    });

    // Act
    const result = await reindexAllSemanticNotes({
      supabase,
      userId: 'user-1',
    });

    // Assert
    expect(result).toEqual({ indexed: 2 });
  });

  it('indexes nothing for an empty vault', async () => {
    // Arrange
    const { supabase } = makeSupabase({ tables: { notes: { data: [] } } });

    // Act|Assert
    await expect(
      reindexAllSemanticNotes({ supabase, userId: 'user-1' }),
    ).resolves.toEqual({ indexed: 0 });
  });

  it('reports a failed vault read', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      tables: { notes: { data: [], error: { message: 'rls' } } },
    });

    // Act|Assert
    await expect(
      reindexAllSemanticNotes({ supabase, userId: 'user-1' }),
    ).rejects.toThrow('rls');
  });
});
