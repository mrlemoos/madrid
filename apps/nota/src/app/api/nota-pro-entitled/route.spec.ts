import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const getServerNotaProEntitled = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({ auth }));
vi.mock('@/server/nota-pro-entitlement', () => ({
  getServerNotaProEntitled,
}));

const route = await import('./route');

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: 'user-1' });
  getServerNotaProEntitled.mockResolvedValue(true);
});

describe('GET /api/nota-pro-entitled', () => {
  it('reports the entitlement behind the session cookie', async () => {
    // Arrange|Act
    const response = await route.GET();

    // Assert
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ entitled: true });
    expect(getServerNotaProEntitled).toHaveBeenCalledWith('user-1');
  });

  it('reports a lapsed subscription rather than failing', async () => {
    // Arrange
    getServerNotaProEntitled.mockResolvedValue(false);

    // Act|Assert
    await expect((await route.GET()).json()).resolves.toEqual({
      entitled: false,
    });
  });

  it('answers 401 with a false entitlement when signed out', async () => {
    // Arrange
    auth.mockResolvedValue({ userId: null });

    // Act
    const response = await route.GET();

    // Assert — the client reads `entitled` on every response
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized',
      entitled: false,
    });
    expect(getServerNotaProEntitled).not.toHaveBeenCalled();
  });

  it('is never cached, since entitlement changes on purchase', () => {
    // Arrange|Act|Assert
    expect(route.dynamic).toBe('force-dynamic');
    expect(route.runtime).toBe('nodejs');
  });
});
