import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireEntitledUserId = vi.fn();
const upsertSemanticIndexForNote = vi.fn();
const requireServiceSupabase = vi.fn(() => ({ client: 'service' }));
const rateLimitIndexNotePost = vi.fn(() => true);
const notaServerExposeErrorDetails = vi.fn(() => false);

vi.mock('server-only', () => ({}));
vi.mock('@/server/route-auth', () => ({ requireEntitledUserId }));
vi.mock('@/server/semantic-search-ops.server', () => ({
  upsertSemanticIndexForNote,
}));
vi.mock('@/server/supabase-service.server', () => ({
  requireServiceSupabase,
}));
vi.mock('@/server/user-rate-limit.server', () => ({ rateLimitIndexNotePost }));
vi.mock('@/server/nota-server-error-detail.server', () => ({
  notaServerExposeErrorDetails,
}));

const route = await import('./route');

const NOTE_ID = '11111111-1111-4111-8111-111111111111';

function post(body: unknown, options: { raw?: string } = {}) {
  return {
    json: () =>
      options.raw === undefined
        ? Promise.resolve(body)
        : Promise.reject(new SyntaxError('Unexpected token')),
  } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireEntitledUserId.mockResolvedValue({ userId: 'user-1' });
  rateLimitIndexNotePost.mockReturnValue(true);
  upsertSemanticIndexForNote.mockResolvedValue({ skipped: false });
  notaServerExposeErrorDetails.mockReturnValue(false);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('POST /api/search/index-note', () => {
  it('indexes the note for the caller', async () => {
    // Arrange|Act
    const response = await route.POST(post({ noteId: NOTE_ID }));

    // Assert
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      skipped: false,
    });
    expect(upsertSemanticIndexForNote).toHaveBeenCalledWith({
      supabase: { client: 'service' },
      userId: 'user-1',
      noteId: NOTE_ID,
    });
  });

  it('reports when the note was already up to date', async () => {
    // Arrange
    upsertSemanticIndexForNote.mockResolvedValue({ skipped: true });

    // Act|Assert
    await expect(
      (await route.POST(post({ noteId: NOTE_ID }))).json(),
    ).resolves.toEqual({ ok: true, skipped: true });
  });

  it('passes the auth gate’s own response straight back', async () => {
    // Arrange
    requireEntitledUserId.mockResolvedValue(
      Response.json({ error: 'Forbidden' }, { status: 403 }),
    );

    // Act
    const response = await route.POST(post({ noteId: NOTE_ID }));

    // Assert
    expect(response.status).toBe(403);
    expect(upsertSemanticIndexForNote).not.toHaveBeenCalled();
  });

  it('rate limits before it does any work', async () => {
    // Arrange
    rateLimitIndexNotePost.mockReturnValue(false);

    // Act
    const response = await route.POST(post({ noteId: NOTE_ID }));

    // Assert
    expect(response.status).toBe(429);
    expect(upsertSemanticIndexForNote).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    // Arrange|Act
    const response = await route.POST(post(undefined, { raw: 'not json' }));

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('rejects a note id that is not a UUID', async () => {
    // Arrange|Act
    const response = await route.POST(post({ noteId: 'note-1' }));

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid body' });
  });

  it('answers 503 when the server has no semantic configuration', async () => {
    // Arrange
    upsertSemanticIndexForNote.mockRejectedValue(
      new Error('set NOTA_SEMANTIC_EMBEDDINGS_API_KEY for semantic search'),
    );

    // Act
    const response = await route.POST(post({ noteId: NOTE_ID }));

    // Assert — a misconfigured server is not the client's fault
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Semantic index is not configured on the server.',
    });
  });

  it('answers 500 without leaking the cause', async () => {
    // Arrange
    upsertSemanticIndexForNote.mockRejectedValue(new Error('Note not found'));

    // Act
    const response = await route.POST(post({ noteId: NOTE_ID }));

    // Assert
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Index update failed',
    });
  });

  it('includes the cause once debug details are turned on', async () => {
    // Arrange
    notaServerExposeErrorDetails.mockReturnValue(true);
    upsertSemanticIndexForNote.mockRejectedValue(new Error('Note not found'));

    // Act
    const response = await route.POST(post({ noteId: NOTE_ID }));

    // Assert
    await expect(response.json()).resolves.toEqual({
      error: 'Index update failed',
      detail: 'Note not found',
    });
  });
});
