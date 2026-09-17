import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireServiceSupabase = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/server/supabase-service.server', () => ({ requireServiceSupabase }));

const route = await import('./route');

/** Records the filters applied, so the spec can pin the token join. */
function makeSupabase(
  options: {
    attachment?: { storage_path: string; content_type: string } | null;
    file?: Blob | null;
    fileError?: { message: string } | null;
  } = {},
) {
  const filters: [string, string][] = [];
  const file = {
    arrayBuffer: vi
      .fn()
      .mockResolvedValue(new TextEncoder().encode('attachment')),
  } as unknown as Blob;
  const download = vi.fn().mockResolvedValue({
    data: options.file === undefined ? file : options.file,
    error: options.fileError ?? null,
  });
  const select = vi.fn();
  const from = vi.fn(() => {
    const chain: Record<string, unknown> = {
      select: (...args: unknown[]) => {
        select(...args);
        return chain;
      },
      eq: (column: string, value: string) => {
        filters.push([column, value]);
        return chain;
      },
      maybeSingle: () =>
        Promise.resolve({
          data:
            options.attachment === undefined
              ? {
                  storage_path: 'user-1/note-1/att-1.png',
                  content_type: 'application/pdf',
                }
              : options.attachment,
          error: null,
        }),
    };
    return chain;
  });
  return {
    supabase: {
      from,
      storage: { from: vi.fn(() => ({ download })) },
    },
    filters,
    select,
    download,
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
  it('streams the attachment from the share origin', async () => {
    // Arrange
    const { supabase, download, select } = makeSupabase();
    requireServiceSupabase.mockReturnValue(supabase);

    // Act
    const response = await route.GET({} as Request, get('tok', 'att-1'));

    // Assert
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('attachment');
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(download).toHaveBeenCalledWith('user-1/note-1/att-1.png');
    expect(select).toHaveBeenCalledWith(
      'storage_path, content_type, notes!note_attachments_note_id_fkey!inner(share_token)',
    );
  });

  it('caches privately', async () => {
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

  it('answers 404 when the file cannot be read', async () => {
    // Arrange
    const { supabase } = makeSupabase({
      file: null,
      fileError: { message: 'object missing' },
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
