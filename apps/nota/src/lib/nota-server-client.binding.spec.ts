import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nota/data-source/clerk-token-ref', () => ({
  getClerkAccessToken: vi.fn(),
}));

vi.mock('@nota/nota-server-client', () => ({
  fetchNotaProEntitled: vi.fn(),
  postNotaProInvalidate: vi.fn(),
  postSemanticSearch: vi.fn(),
  postSearchIndexNote: vi.fn(),
  postSearchReindexAll: vi.fn(),
}));

describe('nota-server-client app binding', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('forwards env + Clerk token to package fetchNotaProEntitled', async () => {
    // Arrange
    vi.stubEnv('VITE_NOTA_SERVER_API_URL', 'https://ns.example');
    vi.resetModules();
    const { getClerkAccessToken } = await import(
      '@nota/data-source/clerk-token-ref'
    );
    const pkg = await import('@nota/nota-server-client');
    vi.mocked(getClerkAccessToken).mockResolvedValue('jwt');
    vi.mocked(pkg.fetchNotaProEntitled).mockResolvedValue(new Response());
    const { fetchNotaProEntitled } = await import('./nota-server-client');

    // Act
    await fetchNotaProEntitled();

    // Assert
    expect(pkg.fetchNotaProEntitled).toHaveBeenCalledWith(
      'https://ns.example',
      'jwt',
    );
  });
});
