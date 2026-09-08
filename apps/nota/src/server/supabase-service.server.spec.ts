import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn(() => ({ client: 'service' }));

vi.mock('@supabase/supabase-js', () => ({ createClient }));

const ENV_KEYS = [
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/** Fresh module per test: the client is cached in module scope. */
async function loadWith(
  env: Partial<Record<(typeof ENV_KEYS)[number], string>>,
) {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  vi.resetModules();
  createClient.mockClear();
  return import('./supabase-service.server');
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe('requireServiceSupabase', () => {
  it('builds a session-less client from the current secret key', async () => {
    // Arrange
    const { requireServiceSupabase } = await loadWith({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_new',
    });

    // Act
    requireServiceSupabase();

    // Assert
    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'sb_secret_new',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  });

  it('prefers the new secret key over the deprecated service role key', async () => {
    // Arrange
    const { requireServiceSupabase } = await loadWith({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_new',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-jwt',
    });

    // Act
    requireServiceSupabase();

    // Assert
    expect(createClient.mock.calls[0]?.[1]).toBe('sb_secret_new');
  });

  it('still works on a deployment that has not rotated yet', async () => {
    // Arrange
    const { requireServiceSupabase } = await loadWith({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'legacy-jwt',
    });

    // Act
    requireServiceSupabase();

    // Assert
    expect(createClient.mock.calls[0]?.[1]).toBe('legacy-jwt');
  });

  it('falls back to the public URL when the server one is unset', async () => {
    // Arrange
    const { requireServiceSupabase } = await loadWith({
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_new',
    });

    // Act
    requireServiceSupabase();

    // Assert
    expect(createClient.mock.calls[0]?.[0]).toBe('https://project.supabase.co');
  });

  it('ignores surrounding whitespace in the environment', async () => {
    // Arrange
    const { requireServiceSupabase } = await loadWith({
      SUPABASE_URL: '  https://project.supabase.co  ',
      SUPABASE_SECRET_KEY: '  sb_secret_new  ',
    });

    // Act
    requireServiceSupabase();

    // Assert
    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'sb_secret_new',
      expect.anything(),
    );
  });

  it('reuses the client across calls', async () => {
    // Arrange
    const { requireServiceSupabase } = await loadWith({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_new',
    });

    // Act
    const first = requireServiceSupabase();
    const second = requireServiceSupabase();

    // Assert
    expect(second).toBe(first);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('fails loudly when the server is not configured', async () => {
    // Arrange
    const { requireServiceSupabase } = await loadWith({
      SUPABASE_URL: 'https://project.supabase.co',
    });

    // Act|Assert — never fall back to the anon key for privileged work
    expect(() => requireServiceSupabase()).toThrow(
      /SUPABASE_URL and SUPABASE_SECRET_KEY/,
    );
  });
});
