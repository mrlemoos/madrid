import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn(() => ({ client: 'browser' }));

vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('@getmadrid/env-nextjs', () => ({
  env: (key: string) =>
    key === 'NEXT_PUBLIC_SUPABASE_URL'
      ? 'https://project.supabase.co'
      : 'anon-key',
}));

const {
  getBrowserClient,
  getSupabaseBrowserClient,
  isSupabaseClerkGetTokenRegistered,
  setSupabaseClerkGetToken,
} = await import('./browser');

beforeEach(() => {
  createClient.mockClear();
});

afterEach(() => {
  setSupabaseClerkGetToken(null);
});

describe('getSupabaseBrowserClient', () => {
  it('refuses to build a client before the Clerk bridge wires a token getter', () => {
    // Arrange|Act|Assert — an unauthenticated client would silently fail RLS
    expect(isSupabaseClerkGetTokenRegistered()).toBe(false);
    expect(() => getSupabaseBrowserClient()).toThrow(/not wired to Clerk yet/);
  });

  it('passes the registered getter through as the access token source', async () => {
    // Arrange
    setSupabaseClerkGetToken(() => Promise.resolve('jwt-123'));

    // Act
    getSupabaseBrowserClient();

    // Assert
    const options = createClient.mock.calls[0]?.[2] as {
      accessToken: () => Promise<string | null>;
    };
    await expect(options.accessToken()).resolves.toBe('jwt-123');
  });

  it('reuses the client until the session changes', () => {
    // Arrange
    setSupabaseClerkGetToken(() => Promise.resolve('jwt-123'));

    // Act
    const first = getSupabaseBrowserClient();
    const second = getSupabaseBrowserClient();

    // Assert
    expect(second).toBe(first);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the client when a new Clerk session registers', () => {
    // Arrange
    setSupabaseClerkGetToken(() => Promise.resolve('jwt-123'));
    getSupabaseBrowserClient();

    // Act — a fresh getter means a fresh session; the cached client is stale
    setSupabaseClerkGetToken(() => Promise.resolve('jwt-456'));
    getSupabaseBrowserClient();

    // Assert
    expect(createClient).toHaveBeenCalledTimes(2);
  });
});

describe('getBrowserClient', () => {
  it('is the same singleton under its shorter name', () => {
    // Arrange
    setSupabaseClerkGetToken(() => Promise.resolve('jwt-123'));

    // Act|Assert
    expect(getBrowserClient()).toBe(getSupabaseBrowserClient());
  });
});
