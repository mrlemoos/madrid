import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();
const getServerNotaProEntitled = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@clerk/nextjs/server', () => ({ auth }));
vi.mock('./nota-pro-entitlement', () => ({ getServerNotaProEntitled }));

const { requireEntitledUserId, requireUserId } = await import('./route-auth');

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: 'user-1' });
  getServerNotaProEntitled.mockResolvedValue(true);
});

describe('requireUserId', () => {
  it('returns the id behind the Clerk session cookie', async () => {
    // Arrange|Act|Assert
    await expect(requireUserId()).resolves.toEqual({ userId: 'user-1' });
  });

  it('answers 401 when there is no session', async () => {
    // Arrange
    auth.mockResolvedValue({ userId: null });

    // Act
    const result = await requireUserId();

    // Assert
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
    await expect((result as Response).json()).resolves.toEqual({
      error: 'Unauthorized',
    });
  });
});

describe('requireEntitledUserId', () => {
  it('returns the id for a signed-in, entitled reader', async () => {
    // Arrange|Act|Assert
    await expect(requireEntitledUserId()).resolves.toEqual({
      userId: 'user-1',
    });
  });

  it('answers 401 before it asks about entitlement', async () => {
    // Arrange
    auth.mockResolvedValue({ userId: null });

    // Act
    const result = (await requireEntitledUserId()) as Response;

    // Assert
    expect(result.status).toBe(401);
    expect(getServerNotaProEntitled).not.toHaveBeenCalled();
  });

  it('answers 403 for a signed-in reader without Madrid Pro', async () => {
    // Arrange
    getServerNotaProEntitled.mockResolvedValue(false);

    // Act
    const result = (await requireEntitledUserId()) as Response;

    // Assert — 403 tells the client to show the paywall, not the sign-in screen
    expect(result.status).toBe(403);
    await expect(result.json()).resolves.toEqual({ error: 'Forbidden' });
  });
});
