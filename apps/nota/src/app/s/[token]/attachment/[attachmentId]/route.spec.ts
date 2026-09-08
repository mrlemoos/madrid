import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireServiceSupabase = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/server/supabase-service.server', () => ({ requireServiceSupabase }));

const route = await import('./route');

/** Records the filters applied, so the spec can pin the token join. */
function makeSupabase(
  options: {
    attachment?: { storage_path: string } | null;
    signed?: { signedUrl: string } | null;
    signedError?: { message: string } | null;
  } = {},
) {
  const filters: [string, string][] = [];
  const createSignedUrl = vi.fn().mockResolvedValue({
    data:
      options.signed === undefined
        ? { signedUrl: 'https://signed.example/att-1.png' }
        : options.signed,
    error: options.signedError ?? null,
  });
  const from = vi.fn(() => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (column: string, value: string) => {
        filters.push([column, value]);
        return chain;
      },
      maybeSingle: () =>
        Promise.resolve({
          data:
            options.attachment === undefined
              ? { storage_path: 'user-1/note-1/att-1.png' }
              : options.attachment,
          error: null,
        }),
    };
    return chain;
  });
  return {
    supabase: {
      from,
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    },
    filters,
    createSignedUrl,
  };
}

function get(token: string, attachmentId: string) {
  return {
    params: Promise.resolve({ token, attachmentId }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /s/[token]/attachment/[attachmentId]', () => {
  it('redirects to a short-lived signed URL', async () => {
    // Arrange
    const { supabase, createSignedUrl } = makeSupabase();
    requireServiceSupabase.mockReturnValue(supabase);

    // Act
    const response = await route.GET({} as Request, get('tok', 'att-1'));

    // Assert
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://signed.example/att-1.png',
    );
    expect(createSignedUrl).toHaveBeenCalledWith(
      'user-1/note-1/att-1.png',
      3600,
    );
  });

  it('caches privately and far short of the signed URL’s life', async () => {
    // Arrange
    const { supabase } = makeSupabase();
    requireServiceSupabase.mockReturnValue(supabase);

    // Act
    const response = await route.GET({} as Request, get('tok', 'att-1'));

    // Assert
    expect(response.headers.get('cache-control')).toBe('private, max-age=60');
  });

  it('requires the attachment to belong to the note behind the token', async () => {
    // Arrange
    const { supabase, filters } = makeSupabase();
    requireServiceSupabase.mockReturnValue(supabase);

    // Act
    await route.GET({} as Request, get('tok', 'att-1'));

    // Assert — the join is what stops a link reading across notes
    expect(filters).toEqual([
      ['id', 'att-1'],
      ['notes.share_token', 'tok'],
    ]);
  });

  it('answers 404 for an attachment from another note', async () => {
    // Arrange
    const { supabase } = makeSupabase({ attachment: null });
    requireServiceSupabase.mockReturnValue(supabase);

    // Act
    const response = await route.GET(
      {} as Request,
      get('tok', 'att-elsewhere'),
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('answers 404 for a missing token or attachment id', async () => {
    // Arrange
    const { supabase } = makeSupabase();
    requireServiceSupabase.mockReturnValue(supabase);

    // Act|Assert
    expect((await route.GET({} as Request, get('', 'att-1'))).status).toBe(404);
    expect((await route.GET({} as Request, get('tok', ''))).status).toBe(404);
    expect(requireServiceSupabase).not.toHaveBeenCalled();
  });

  it('answers 404 when the file cannot be signed', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      signed: null,
      signedError: { message: 'object missing' },
    });
    requireServiceSupabase.mockReturnValue(supabase);

    // Act
    const response = await route.GET({} as Request, get('tok', 'att-1'));

    // Assert
    expect(response.status).toBe(404);
  });

  it('answers 503 when the server is not configured for storage', async () => {
    // Arrange
    requireServiceSupabase.mockImplementation(() => {
      throw new Error('set SUPABASE_SECRET_KEY');
    });

    // Act
    const response = await route.GET({} as Request, get('tok', 'att-1'));

    // Assert — the image node renders its own failure state, not a broken image
    expect(response.status).toBe(503);
  });
});
