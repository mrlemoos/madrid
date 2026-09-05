import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@getmadrid/data-source/clerk-token-ref', () => ({
  getClerkAccessToken: vi.fn(),
}));

describe('nota-server-client app binding', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetches the same-origin entitled route (Clerk cookie auth, no bearer)', async () => {
    // Arrange
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);
    const { fetchNotaProEntitled } = await import('./nota-server-client');

    // Act
    await fetchNotaProEntitled();

    // Assert
    expect(fetchMock).toHaveBeenCalledWith('/api/nota-pro-entitled');
  });

  it('posts the same-origin invalidate route', async () => {
    // Arrange
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal('fetch', fetchMock);
    const { postNotaProInvalidate } = await import('./nota-server-client');

    // Act
    await postNotaProInvalidate();

    // Assert
    expect(fetchMock).toHaveBeenCalledWith('/api/nota-pro-invalidate', {
      method: 'POST',
    });
  });
});
