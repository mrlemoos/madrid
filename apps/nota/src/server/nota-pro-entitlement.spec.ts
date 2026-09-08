import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getUserBillingSubscription = vi.fn();
const createClerkClient = vi.fn(() => ({
  billing: { getUserBillingSubscription },
}));

vi.mock('server-only', () => ({}));
vi.mock('@clerk/backend', () => ({ createClerkClient }));

/** Fresh module per test: the entitlement cache lives in module scope. */
async function loadModule() {
  vi.resetModules();
  createClerkClient.mockClear();
  getUserBillingSubscription.mockClear();
  return import('./nota-pro-entitlement');
}

beforeEach(() => {
  process.env.CLERK_SECRET_KEY = 'sk_test';
  getUserBillingSubscription.mockResolvedValue({ status: 'active' });
});

afterEach(() => {
  delete process.env.CLERK_SECRET_KEY;
  vi.useRealTimers();
});

describe('getServerNotaProEntitled', () => {
  it('is entitled for an active subscription', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();

    // Act|Assert
    await expect(getServerNotaProEntitled('user-1')).resolves.toBe(true);
  });

  it('keeps access during a trial and while payment is being retried', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();

    // Act|Assert — locking a paying reader out of their vault is worse
    for (const status of ['trialing', 'past_due']) {
      getUserBillingSubscription.mockResolvedValue({ status });
      await expect(getServerNotaProEntitled(`user-${status}`)).resolves.toBe(
        true,
      );
    }
  });

  it('fails closed on a status it does not know', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();
    getUserBillingSubscription.mockResolvedValue({ status: 'canceled' });

    // Act|Assert
    await expect(getServerNotaProEntitled('user-1')).resolves.toBe(false);
  });

  it('fails closed when the server has no Clerk secret', async () => {
    // Arrange
    delete process.env.CLERK_SECRET_KEY;
    const { getServerNotaProEntitled } = await loadModule();

    // Act|Assert
    await expect(getServerNotaProEntitled('user-1')).resolves.toBe(false);
    expect(createClerkClient).not.toHaveBeenCalled();
  });

  it('ignores a blank secret', async () => {
    // Arrange
    process.env.CLERK_SECRET_KEY = '   ';
    const { getServerNotaProEntitled } = await loadModule();

    // Act|Assert
    await expect(getServerNotaProEntitled('user-1')).resolves.toBe(false);
  });

  it('fails closed when Clerk cannot be reached', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();
    getUserBillingSubscription.mockRejectedValue(new Error('network'));

    // Act|Assert
    await expect(getServerNotaProEntitled('user-1')).resolves.toBe(false);
  });

  it('serves a repeat check from cache', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();

    // Act
    await getServerNotaProEntitled('user-1');
    await getServerNotaProEntitled('user-1');

    // Assert
    expect(getUserBillingSubscription).toHaveBeenCalledTimes(1);
  });

  it('re-checks once the cache entry ages out', async () => {
    // Arrange
    vi.useFakeTimers();
    const { getServerNotaProEntitled } = await loadModule();
    await getServerNotaProEntitled('user-1');

    // Act
    vi.advanceTimersByTime(60_001);
    await getServerNotaProEntitled('user-1');

    // Assert
    expect(getUserBillingSubscription).toHaveBeenCalledTimes(2);
  });

  it('caches a reader Clerk has no subscription for', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();
    getUserBillingSubscription.mockRejectedValue({ status: 404 });

    // Act
    await getServerNotaProEntitled('user-1');
    await getServerNotaProEntitled('user-1');

    // Assert — a missing subscription is a stable answer, unlike a network blip
    expect(getUserBillingSubscription).toHaveBeenCalledTimes(1);
  });

  it('does not cache a transient failure', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();
    getUserBillingSubscription.mockRejectedValue(new Error('network'));

    // Act
    await getServerNotaProEntitled('user-1');
    await getServerNotaProEntitled('user-1');

    // Assert
    expect(getUserBillingSubscription).toHaveBeenCalledTimes(2);
  });

  it('keeps each reader’s entitlement separate', async () => {
    // Arrange
    const { getServerNotaProEntitled } = await loadModule();
    getUserBillingSubscription.mockResolvedValueOnce({ status: 'active' });
    getUserBillingSubscription.mockResolvedValueOnce({ status: 'canceled' });

    // Act|Assert
    await expect(getServerNotaProEntitled('user-1')).resolves.toBe(true);
    await expect(getServerNotaProEntitled('user-2')).resolves.toBe(false);
  });
});

describe('invalidateServerNotaProCache', () => {
  it('forces a re-check after a purchase', async () => {
    // Arrange
    const { getServerNotaProEntitled, invalidateServerNotaProCache } =
      await loadModule();
    getUserBillingSubscription.mockResolvedValue({ status: 'canceled' });
    await getServerNotaProEntitled('user-1');

    // Act
    invalidateServerNotaProCache('user-1');
    getUserBillingSubscription.mockResolvedValue({ status: 'active' });

    // Assert — the paywall must clear as soon as checkout completes
    await expect(getServerNotaProEntitled('user-1')).resolves.toBe(true);
  });
});
