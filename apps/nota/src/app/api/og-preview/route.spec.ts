import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireEntitledUserId = vi.fn();
const fetchOgPreview = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/server/route-auth', () => ({ requireEntitledUserId }));
vi.mock('@/server/og-preview.server', () => ({ fetchOgPreview }));

const route = await import('./route');

function get(url: string) {
  return { url } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireEntitledUserId.mockResolvedValue({ userId: 'user-1' });
  fetchOgPreview.mockResolvedValue({ title: 'Quiet software' });
});

describe('GET /api/og-preview', () => {
  it('unfurls the requested link', async () => {
    // Arrange|Act
    const response = await route.GET(
      get(
        'https://app.getmadrid.app/api/og-preview?url=https%3A%2F%2Fexample.com',
      ),
    );

    // Assert
    await expect(response.json()).resolves.toEqual({ title: 'Quiet software' });
    expect(fetchOgPreview).toHaveBeenCalledWith('https://example.com');
  });

  it('keeps the unfurler behind the entitlement gate', async () => {
    // Arrange
    requireEntitledUserId.mockResolvedValue(
      Response.json({ error: 'Forbidden' }, { status: 403 }),
    );

    // Act
    const response = await route.GET(
      get(
        'https://app.getmadrid.app/api/og-preview?url=https%3A%2F%2Fexample.com',
      ),
    );

    // Assert — the fetcher is a server-side request on behalf of the caller
    expect(response.status).toBe(403);
    expect(fetchOgPreview).not.toHaveBeenCalled();
  });

  it('rejects a request with no url', async () => {
    // Arrange|Act
    const response = await route.GET(
      get('https://app.getmadrid.app/api/og-preview'),
    );

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing url' });
  });

  it('reports a link it refused to follow', async () => {
    // Arrange
    fetchOgPreview.mockRejectedValue(new Error('Blocked host'));

    // Act
    const response = await route.GET(
      get(
        'https://app.getmadrid.app/api/og-preview?url=http%3A%2F%2F169.254.169.254',
      ),
    );

    // Assert
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Blocked host' });
  });
});
