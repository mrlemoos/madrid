import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const semanticSearchNotes = vi.fn();
const upsertSemanticIndexForNote = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('./semantic-search-ops.server', () => ({
  semanticSearchNotes,
  upsertSemanticIndexForNote,
}));

const {
  McpNotFoundError,
  mcpAppendToNote,
  mcpCreateNote,
  mcpGetNote,
  mcpListFolders,
  mcpListNotes,
  mcpSearchNotes,
} = await import('./mcp-notes.server');

type Query = { table: string; ops: Array<[string, unknown[]]> };
type Result = { data?: unknown; error?: { message: string } | null };

/** Chainable PostgREST stand-in: records every call, answers from a per-table queue. */
function fakeSupabase(responses: Record<string, Result[]>) {
  const queries: Query[] = [];
  const client = {
    from(table: string) {
      const query: Query = { table, ops: [] };
      queries.push(query);
      const builder: Record<string, unknown> = {
        then(resolve: (r: Result) => void) {
          resolve(responses[table]?.shift() ?? { data: null, error: null });
        },
      };
      for (const op of [
        'select',
        'eq',
        'in',
        'order',
        'range',
        'insert',
        'update',
        'maybeSingle',
        'single',
      ]) {
        builder[op] = (...args: unknown[]) => {
          query.ops.push([op, args]);
          return builder;
        };
      }
      return builder;
    },
  };
  return { supabase: client as unknown as SupabaseClient, queries };
}

const USER = 'user_1';

function ops(q: Query, name: string): unknown[][] {
  return q.ops.filter(([op]) => op === name).map(([, args]) => args);
}

/** The cross-tenant guard: every notes/folders query filters or writes this user. */
function expectEveryQueryScoped(queries: Query[]) {
  for (const q of queries.filter((x) => x.table !== 'note_yjs_updates')) {
    const filtered = ops(q, 'eq').some(
      ([col, val]) => col === 'user_id' && val === USER,
    );
    const inserted = ops(q, 'insert').some(
      ([row]) => (row as { user_id?: string }).user_id === USER,
    );
    expect(filtered || inserted, `${q.table} query not scoped`).toBe(true);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  upsertSemanticIndexForNote.mockResolvedValue({ skipped: false });
});

describe('mcpListNotes', () => {
  it('lists the user’s notes newest first within the requested page', async () => {
    // Arrange
    const rows = [{ id: 'n1', title: 'A', folder_id: null, updated_at: 't' }];
    const { supabase, queries } = fakeSupabase({ notes: [{ data: rows }] });

    // Act
    const result = await mcpListNotes(supabase, USER, {
      folderId: 'f1',
      limit: 25,
      offset: 50,
    });

    // Assert
    expect(result).toEqual(rows);
    expect(ops(queries[0], 'eq')).toContainEqual(['folder_id', 'f1']);
    expect(ops(queries[0], 'range')).toEqual([[50, 74]]);
    expectEveryQueryScoped(queries);
  });
});

describe('mcpListFolders', () => {
  it('lists only the user’s folders', async () => {
    // Arrange
    const { supabase, queries } = fakeSupabase({
      folders: [{ data: [{ id: 'f1', name: 'Work', parent_id: null }] }],
    });

    // Act
    const result = await mcpListFolders(supabase, USER);

    // Assert
    expect(result).toEqual([{ id: 'f1', name: 'Work', parent_id: null }]);
    expectEveryQueryScoped(queries);
  });
});

describe('mcpGetNote', () => {
  it('returns the body as markdown', async () => {
    // Arrange
    const { supabase, queries } = fakeSupabase({
      notes: [
        {
          data: {
            id: 'n1',
            title: 'T',
            folder_id: null,
            updated_at: 't',
            content: {
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
              ],
            },
          },
        },
      ],
    });

    // Act
    const note = await mcpGetNote(supabase, USER, 'n1');

    // Assert
    expect(note).toMatchObject({ id: 'n1', markdown: 'hi', truncated: false });
    expectEveryQueryScoped(queries);
  });

  it('treats another user’s note as not found', async () => {
    // Arrange
    const { supabase } = fakeSupabase({ notes: [{ data: null }] });

    // Act|Assert
    await expect(mcpGetNote(supabase, USER, 'theirs')).rejects.toBeInstanceOf(
      McpNotFoundError,
    );
  });

  it('truncates very long notes and says so', async () => {
    // Arrange
    const text = 'x'.repeat(150_000);
    const { supabase } = fakeSupabase({
      notes: [
        {
          data: {
            id: 'n1',
            title: 'T',
            content: {
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text }] },
              ],
            },
          },
        },
      ],
    });

    // Act
    const note = await mcpGetNote(supabase, USER, 'n1');

    // Assert
    expect(note.truncated).toBe(true);
    expect(note.markdown).toHaveLength(100_000);
  });
});

describe('mcpSearchNotes', () => {
  it('keeps semantic ranking and drops ids the user does not own', async () => {
    // Arrange
    semanticSearchNotes.mockResolvedValue({
      results: [{ noteId: 'n2' }, { noteId: 'gone' }, { noteId: 'n1' }],
    });
    const { supabase, queries } = fakeSupabase({
      notes: [
        {
          data: [
            { id: 'n1', title: 'One', content: null },
            { id: 'n2', title: 'Two', content: null },
          ],
        },
      ],
    });

    // Act
    const results = await mcpSearchNotes(supabase, USER, 'q', 20);

    // Assert
    expect(results.map((r: { id: string }) => r.id)).toEqual(['n2', 'n1']);
    expect(semanticSearchNotes).toHaveBeenCalledWith({
      supabase,
      userId: USER,
      query: 'q',
    });
    expectEveryQueryScoped(queries);
  });
});

describe('mcpCreateNote', () => {
  it('creates the note from markdown for this user without a Yjs row', async () => {
    // Arrange
    const { supabase, queries } = fakeSupabase({
      folders: [{ data: { id: 'f1' } }],
      notes: [{ data: { id: 'n9', title: 'Plan' } }],
    });

    // Act
    const created = await mcpCreateNote(supabase, USER, {
      title: ' Plan ',
      markdown: '# Goals',
      folderId: 'f1',
    });

    // Assert
    expect(created).toEqual({ id: 'n9', title: 'Plan' });
    const [insert] = queries.filter((q) => q.table === 'notes');
    expect(ops(insert, 'insert')[0][0]).toMatchObject({
      user_id: USER,
      title: 'Plan',
      folder_id: 'f1',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Goals' }],
          },
        ],
      },
    });
    expect(queries.some((q) => q.table === 'note_yjs_updates')).toBe(false);
    expect(upsertSemanticIndexForNote).toHaveBeenCalledWith({
      supabase,
      userId: USER,
      noteId: 'n9',
    });
    expectEveryQueryScoped(queries);
  });

  it('refuses a folder the user does not own', async () => {
    // Arrange
    const { supabase, queries } = fakeSupabase({ folders: [{ data: null }] });

    // Act|Assert
    await expect(
      mcpCreateNote(supabase, USER, {
        title: 'x',
        markdown: '',
        folderId: 'theirs',
      }),
    ).rejects.toBeInstanceOf(McpNotFoundError);
    expect(queries.some((q) => q.table === 'notes')).toBe(false);
  });

  it('still succeeds when search indexing is unavailable', async () => {
    // Arrange
    upsertSemanticIndexForNote.mockRejectedValue(new Error('no embeddings'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { supabase } = fakeSupabase({
      notes: [{ data: { id: 'n1', title: 'Untitled Note' } }],
    });

    // Act
    const created = await mcpCreateNote(supabase, USER, {
      title: '',
      markdown: '',
    });

    // Assert
    expect(created.id).toBe('n1');
  });
});

describe('mcpAppendToNote', () => {
  const content = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'old' }] }],
  };

  it('writes a Yjs delta and the content read-model when the note has a log', async () => {
    // Arrange
    const { supabase, queries } = fakeSupabase({
      notes: [{ data: { id: 'n1', content } }, { error: null }],
      note_yjs_updates: [{ data: [{ update: 'AAA=' }] }, { error: null }],
    });

    // Act
    const result = await mcpAppendToNote(supabase, USER, {
      noteId: 'n1',
      markdown: 'new',
      actor: 'mcp:client_1',
    });

    // Assert
    expect(result).toEqual({ id: 'n1', appendedBlocks: 1 });
    const yjsInsert = queries.filter((q) => q.table === 'note_yjs_updates')[1];
    expect(ops(yjsInsert, 'insert')[0][0]).toMatchObject({
      note_id: 'n1',
      actor: 'mcp:client_1',
    });
    const contentUpdate = queries.filter((q) => q.table === 'notes')[1];
    expect(ops(contentUpdate, 'update')[0][0]).toEqual({
      content: {
        type: 'doc',
        content: [
          ...content.content,
          { type: 'paragraph', content: [{ type: 'text', text: 'new' }] },
        ],
      },
    });
    expectEveryQueryScoped(queries);
  });

  it('only touches content when the note has never been opened in Yjs', async () => {
    // Arrange
    const { supabase, queries } = fakeSupabase({
      notes: [{ data: { id: 'n1', content } }, { error: null }],
      note_yjs_updates: [{ data: [] }],
    });

    // Act
    await mcpAppendToNote(supabase, USER, {
      noteId: 'n1',
      markdown: 'new',
      actor: 'mcp:c',
    });

    // Assert
    const yjsWrites = queries
      .filter((q) => q.table === 'note_yjs_updates')
      .flatMap((q) => ops(q, 'insert'));
    expect(yjsWrites).toEqual([]);
    expect(
      ops(queries.filter((q) => q.table === 'notes')[1], 'update'),
    ).toHaveLength(1);
  });

  it('never reads or writes the Yjs log of a note the user does not own', async () => {
    // Arrange
    const { supabase, queries } = fakeSupabase({ notes: [{ data: null }] });

    // Act|Assert
    await expect(
      mcpAppendToNote(supabase, USER, {
        noteId: 'theirs',
        markdown: 'x',
        actor: 'mcp:c',
      }),
    ).rejects.toBeInstanceOf(McpNotFoundError);
    expect(queries.map((q) => q.table)).toEqual(['notes']);
  });
});
