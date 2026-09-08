import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireEntitledUserId = vi.fn();
const reindexAllSemanticNotes = vi.fn();
const requireServiceSupabase = vi.fn(() => ({ client: 'service' }));
const rateLimitReindexAllPost = vi.fn(() => true);
const notaServerExposeErrorDetails = vi.fn(() => false);

vi.mock('server-only', () => ({}));
vi.mock('@/server/route-auth', () => ({ requireEntitledUserId }));
vi.mock('@/server/semantic-search-ops.server', () => ({
  reindexAllSemanticNotes,
}));
vi.mock('@/server/supabase-service.server', () => ({ requireServiceSupabase }));
vi.mock('@/server/user-rate-limit.server', () => ({ rateLimitReindexAllPost }));
vi.mock('@/server/nota-server-error-detail.server', () => ({
  notaServerExposeErrorDetails,
}));

const route = await import('./route');

beforeEach(() => {
  vi.clearAllMocks();
  requireEntitledUserId.mockResolvedValue({ userId: 'user-1' });
  rateLimitReindexAllPost.mockReturnValue(true);
  reindexAllSemanticNotes.mockResolvedValue({ indexed: 12 });
  notaServerExposeErrorDetails.mockReturnValue(false);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('POST /api/search/reindex-all', () => {
  it('rebuilds the caller’s index and reports the count', async () => {
    // Arrange|Act
    const response = await route.POST();

    // Assert
    await expect(response.json()).resolves.toEqual({ ok: true, indexed: 12 });
    expect(reindexAllSemanticNotes).toHaveBeenCalledWith({
      supabase: { client: 'service' },
      userId: 'user-1',
    });
  });

  it('passes the auth gate’s response straight back', async () => {
    // Arrange
    requireEntitledUserId.mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    // Act|Assert
    expect((await route.POST()).status).toBe(401);
    expect(reindexAllSemanticNotes).not.toHaveBeenCalled();
  });

  it('rate limits this expensive job before running it', async () => {
    // Arrange
    rateLimitReindexAllPost.mockReturnValue(false);

    // Act
    const response = await route.POST();

    // Assert — a full reindex embeds every note in the vault
    expect(response.status).toBe(429);
    expect(reindexAllSemanticNotes).not.toHaveBeenCalled();
  });

  it('answers 503 when semantic search is not configured', async () => {
    // Arrange
    reindexAllSemanticNotes.mockRejectedValue(
      new Error('set SUPABASE_SECRET_KEY'),
    );

    // Act
    const response = await route.POST();

    // Assert
    expect(response.status).toBe(503);
  });

  it('answers 500 without leaking the cause', async () => {
    // Arrange
    reindexAllSemanticNotes.mockRejectedValue(new Error('rls'));

    // Act
    const response = await route.POST();

    // Assert
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Reindex failed' });
  });
});
