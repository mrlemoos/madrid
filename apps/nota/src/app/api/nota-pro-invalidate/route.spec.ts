import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const invalidateServerNotaProCache = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({ auth }));
vi.mock('@/server/nota-pro-entitlement', () => ({
  invalidateServerNotaProCache,
}));

const route = await import('./route');

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: 'user-1' });
});

describe('POST /api/nota-pro-invalidate', () => {
  it('drops only the caller’s cached entitlement', async () => {
    // Arrange|Act
    const response = await route.POST();

    // Assert
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(invalidateServerNotaProCache).toHaveBeenCalledWith('user-1');
  });

  it('refuses a signed-out caller, so nobody can flush another account', async () => {
    // Arrange
    auth.mockResolvedValue({ userId: null });

    // Act
    const response = await route.POST();

    // Assert
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false });
    expect(invalidateServerNotaProCache).not.toHaveBeenCalled();
  });
});
