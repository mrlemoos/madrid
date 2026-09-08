import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * grabkit resolves relative endpoints against `window.location.origin` and calls
 * the platform `fetch`, so stubbing the global still exercises the real binding.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('nota-server-client app binding', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetches the same-origin entitled route (Clerk cookie auth, no bearer)', async () => {
    // Arrange
    vi.resetModules();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ entitled: true }));
    vi.stubGlobal('fetch', fetchMock);
    const { fetchNotaProEntitled } = await import('./nota-server-client');

    // Act
    const entitled = await fetchNotaProEntitled();

    // Assert
    expect(entitled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `${window.location.origin}/api/nota-pro-entitled`,
      { method: 'GET', body: undefined, headers: expect.any(Headers) },
    );
  });

  it('rejects with the status when the entitled route fails', async () => {
    // Arrange
    vi.resetModules();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'Unauthorized' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    const { fetchNotaProEntitled } = await import('./nota-server-client');

    // Act
    const act = fetchNotaProEntitled();

    // Assert
    await expect(act).rejects.toThrow('Entitlement fetch failed: 401');
  });

  it('posts the same-origin invalidate route', async () => {
    // Arrange
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const { postNotaProInvalidate } = await import('./nota-server-client');

    // Act
    await postNotaProInvalidate();

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      `${window.location.origin}/api/nota-pro-invalidate`,
      { method: 'POST', body: undefined, headers: expect.any(Headers) },
    );
  });
});
