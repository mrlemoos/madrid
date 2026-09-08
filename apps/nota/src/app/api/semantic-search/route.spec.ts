import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireEntitledUserId = vi.fn();
const semanticSearchNotes = vi.fn();
const requireServiceSupabase = vi.fn(() => ({ client: 'service' }));
const rateLimitSemanticSearchPost = vi.fn(() => true);
const notaServerExposeErrorDetails = vi.fn(() => false);

vi.mock('server-only', () => ({}));
vi.mock('@/server/route-auth', () => ({ requireEntitledUserId }));
vi.mock('@/server/semantic-search-ops.server', () => ({ semanticSearchNotes }));
vi.mock('@/server/supabase-service.server', () => ({ requireServiceSupabase }));
vi.mock('@/server/user-rate-limit.server', () => ({
  rateLimitSemanticSearchPost,
}));
vi.mock('@/server/nota-server-error-detail.server', () => ({
  notaServerExposeErrorDetails,
}));

const route = await import('./route');

function post(body: unknown, options: { invalidJson?: boolean } = {}) {
  return {
    json: () =>
      options.invalidJson
        ? Promise.reject(new SyntaxError('Unexpected token'))
        : Promise.resolve(body),
  } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireEntitledUserId.mockResolvedValue({ userId: 'user-1' });
  rateLimitSemanticSearchPost.mockReturnValue(true);
  semanticSearchNotes.mockResolvedValue({ results: [{ noteId: 'note-1' }] });
  notaServerExposeErrorDetails.mockReturnValue(false);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('POST /api/semantic-search', () => {
  it('searches the caller’s own vault', async () => {
    // Arrange|Act
    const response = await route.POST(post({ query: 'travel plans' }));

    // Assert
    await expect(response.json()).resolves.toEqual({
      results: [{ noteId: 'note-1' }],
    });
    expect(semanticSearchNotes).toHaveBeenCalledWith({
      supabase: { client: 'service' },
      userId: 'user-1',
      query: 'travel plans',
    });
  });

  it('passes the auth gate’s response straight back', async () => {
    // Arrange
    requireEntitledUserId.mockResolvedValue(
      Response.json({ error: 'Forbidden' }, { status: 403 }),
    );

    // Act|Assert
    expect((await route.POST(post({ query: 'x' }))).status).toBe(403);
    expect(semanticSearchNotes).not.toHaveBeenCalled();
  });

  it('rate limits before embedding anything', async () => {
    // Arrange
    rateLimitSemanticSearchPost.mockReturnValue(false);

    // Act
    const response = await route.POST(post({ query: 'x' }));

    // Assert
    expect(response.status).toBe(429);
    expect(semanticSearchNotes).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    // Arrange|Act
    const response = await route.POST(post(undefined, { invalidJson: true }));

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('rejects a query that is missing or oversized', async () => {
    // Arrange|Act|Assert
    expect((await route.POST(post({}))).status).toBe(400);
    expect((await route.POST(post({ query: 'x'.repeat(4001) }))).status).toBe(
      400,
    );
    expect(semanticSearchNotes).not.toHaveBeenCalled();
  });

  it('accepts a query right at the limit', async () => {
    // Arrange|Act
    const response = await route.POST(post({ query: 'x'.repeat(4000) }));

    // Assert
    expect(response.status).toBe(200);
  });

  it('answers 503 when semantic search is not configured', async () => {
    // Arrange
    semanticSearchNotes.mockRejectedValue(
      new Error('NOTA_SEMANTIC_EMBEDDINGS_API_KEY missing'),
    );

    // Act
    const response = await route.POST(post({ query: 'x' }));

    // Assert
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Semantic search is not configured on the server.',
    });
  });

  it('answers 500 without leaking the cause', async () => {
    // Arrange
    semanticSearchNotes.mockRejectedValue(new Error('rpc exploded'));

    // Act
    const response = await route.POST(post({ query: 'x' }));

    // Assert
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Semantic search failed',
    });
  });
});
