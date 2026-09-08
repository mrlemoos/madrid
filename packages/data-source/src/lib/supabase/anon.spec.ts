import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn(() => ({ client: 'anon' }));

vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('@getmadrid/env-nextjs', () => ({
  env: (key: string) =>
    key === 'NEXT_PUBLIC_SUPABASE_URL'
      ? 'https://project.supabase.co'
      : 'anon-key',
}));

const { getSupabaseAnonClient } = await import('./anon');

beforeEach(() => {
  createClient.mockClear();
});

describe('getSupabaseAnonClient', () => {
  it('builds a session-less client, so a signed-out reader is never persisted', () => {
    // Arrange|Act
    getSupabaseAnonClient();

    // Assert
    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'anon-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  });

  it('returns the same client on every call', () => {
    // Arrange|Act
    const first = getSupabaseAnonClient();
    const second = getSupabaseAnonClient();

    // Assert
    expect(second).toBe(first);
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('getSupabaseAnonClient without configuration', () => {
  it('fails loudly rather than building a client against undefined', async () => {
    // Arrange
    vi.resetModules();
    vi.doMock('@getmadrid/env-nextjs', () => ({ env: () => undefined }));

    // Act
    const { getSupabaseAnonClient: unconfigured } = await import('./anon');

    // Assert
    expect(() => unconfigured()).toThrow(
      'Missing Supabase environment variables',
    );
    vi.doUnmock('@getmadrid/env-nextjs');
  });
});
