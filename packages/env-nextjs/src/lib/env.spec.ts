import { afterEach, describe, expect, it, vi } from 'vitest';

describe('env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns a known NEXT_PUBLIC value from process.env', async () => {
    // Arrange
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test_shared');
    vi.resetModules();
    const { env } = await import('./env');

    // Act
    const value = env('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');

    // Assert
    expect(value).toBe('pk_test_shared');
  });

  it('returns undefined for an empty NEXT_PUBLIC value', async () => {
    // Arrange
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', '');
    vi.resetModules();
    const { env } = await import('./env');

    // Act
    const value = env('NEXT_PUBLIC_POSTHOG_HOST');

    // Assert
    expect(value).toBeUndefined();
  });

  it('returns undefined for keys outside the known NEXT_PUBLIC set', async () => {
    // Arrange
    vi.resetModules();
    const { env } = await import('./env');

    // Act
    const value = env('SOME_UNRELATED_KEY');

    // Assert
    expect(value).toBeUndefined();
  });
});
