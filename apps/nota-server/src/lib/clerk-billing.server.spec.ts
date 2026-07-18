import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const getUserBillingSubscription = mock();

mock.module('@clerk/backend', () => ({
  createClerkClient: () => ({
    billing: {
      getUserBillingSubscription: (...args: unknown[]) =>
        getUserBillingSubscription(...args),
    },
  }),
}));

const { getServerNotaProEntitled, invalidateServerNotaProCache } =
  await import('./clerk-billing.server.ts');

describe('getServerNotaProEntitled', () => {
  const prevSecret = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    process.env.CLERK_SECRET_KEY = 'sk_test_dummy';
    getUserBillingSubscription.mockReset();
  });

  afterEach(() => {
    if (prevSecret === undefined) {
      delete process.env.CLERK_SECRET_KEY;
    } else {
      process.env.CLERK_SECRET_KEY = prevSecret;
    }
    invalidateServerNotaProCache('user-1');
  });

  it('returns false when the secret is missing', async () => {
    // Arrange
    delete process.env.CLERK_SECRET_KEY;
    const userId = 'user-1';

    // Act
    const entitled = await getServerNotaProEntitled(userId);

    // Assert
    expect(entitled).toBe(false);
  });

  it('returns true for an active subscription', async () => {
    // Arrange
    getUserBillingSubscription.mockImplementation(() =>
      Promise.resolve({ status: 'active' }),
    );
    const userId = 'user-1';

    // Act
    const entitled = await getServerNotaProEntitled(userId);

    // Assert
    expect(entitled).toBe(true);
  });

  it('returns false on 404 / missing subscription', async () => {
    // Arrange
    getUserBillingSubscription.mockImplementation(() =>
      Promise.reject({
        status: 404,
        errors: [{ code: 'resource_not_found' }],
      }),
    );
    const userId = 'user-1';

    // Act
    const entitled = await getServerNotaProEntitled(userId);

    // Assert
    expect(entitled).toBe(false);
  });
});
