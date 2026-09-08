import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireServiceSupabase = vi.fn();
const imageResponses: { element: unknown; options: unknown }[] = [];

vi.mock('server-only', () => ({}));
vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(element: unknown, options: unknown) {
      imageResponses.push({ element, options });
    }
  },
}));
vi.mock('@/server/supabase-service.server', () => ({ requireServiceSupabase }));

const image = await import('./opengraph-image');

/** Supabase double: a shared note row, its banner attachment, and the file. */
function makeSupabase(
  options: {
    note?: Record<string, unknown> | null;
    attachment?: Record<string, unknown> | null;
    file?: { arrayBuffer: () => Promise<ArrayBuffer> } | null;
  } = {},
) {
  const download = vi.fn().mockResolvedValue({
    data:
      options.file === undefined
        ? {
            arrayBuffer: () =>
              Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
          }
        : options.file,
  });
  const from = vi.fn((table: string) => {
    const data =
      table === 'notes'
        ? options.note === undefined
          ? {
              title: 'Boarding pass',
              content: { type: 'doc' },
              banner_attachment_id: null,
            }
          : options.note
        : options.attachment === undefined
          ? {
              storage_path: 'user-1/note-1/banner.png',
              content_type: 'image/png',
            }
          : options.attachment;
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: () => Promise.resolve({ data, error: null }),
    };
    return chain;
  });
  return {
    from,
    storage: { from: vi.fn(() => ({ download })) },
    download,
  };
}

/** Flattens the rendered card so text and image sources can be asserted. */
function renderedCard() {
  return JSON.stringify(imageResponses.at(-1)?.element);
}

beforeEach(() => {
  vi.clearAllMocks();
  imageResponses.length = 0;
  requireServiceSupabase.mockReturnValue(makeSupabase());
});

describe('shared note opengraph image', () => {
  it('is a 1200x630 PNG, cached like the page', () => {
    // Arrange|Act|Assert
    expect(image.size).toEqual({ width: 1200, height: 630 });
    expect(image.contentType).toBe('image/png');
    expect(image.revalidate).toBe(300);
  });

  it('titles the card with the note', async () => {
    // Arrange|Act
    await image.default({ params: Promise.resolve({ token: 'tok' }) });

    // Assert
    expect(renderedCard()).toContain('Boarding pass');
    expect(imageResponses.at(-1)?.options).toMatchObject(image.size);
  });

  it('inlines the banner rather than exposing a signed URL', async () => {
    // Arrange
    requireServiceSupabase.mockReturnValue(
      makeSupabase({
        note: {
          title: 'Boarding pass',
          content: { type: 'doc' },
          banner_attachment_id: 'att-1',
        },
      }),
    );

    // Act
    await image.default({ params: Promise.resolve({ token: 'tok' }) });

    // Assert — the bucket stays private and the token remains the only secret
    expect(renderedCard()).toContain('data:image/png;base64,AQID');
  });

  it('falls back to the brand card when the note has no banner', async () => {
    // Arrange|Act
    await image.default({ params: Promise.resolve({ token: 'tok' }) });

    // Assert
    expect(renderedCard()).not.toContain('data:image');
  });

  it('falls back when the banner attachment or its file is missing', async () => {
    // Arrange
    const noteWithBanner = {
      title: 'Boarding pass',
      content: { type: 'doc' },
      banner_attachment_id: 'att-1',
    };

    // Act|Assert
    requireServiceSupabase.mockReturnValue(
      makeSupabase({ note: noteWithBanner, attachment: null }),
    );
    await image.default({ params: Promise.resolve({ token: 'tok' }) });
    expect(renderedCard()).not.toContain('data:image');

    requireServiceSupabase.mockReturnValue(
      makeSupabase({ note: noteWithBanner, file: null }),
    );
    await image.default({ params: Promise.resolve({ token: 'tok' }) });
    expect(renderedCard()).not.toContain('data:image');
  });

  it('renders the brand card for an unknown token', async () => {
    // Arrange
    requireServiceSupabase.mockReturnValue(makeSupabase({ note: null }));

    // Act
    await image.default({ params: Promise.resolve({ token: 'unknown' }) });

    // Assert
    expect(renderedCard()).toContain('Madrid');
  });

  it('degrades to the brand card rather than serving a broken image', async () => {
    // Arrange
    requireServiceSupabase.mockImplementation(() => {
      throw new Error('set SUPABASE_SECRET_KEY');
    });

    // Act
    await image.default({ params: Promise.resolve({ token: 'tok' }) });

    // Assert
    expect(imageResponses).toHaveLength(1);
    expect(renderedCard()).toContain('Madrid');
  });

  it('does not read the database for an empty token', async () => {
    // Arrange|Act
    await image.default({ params: Promise.resolve({ token: '' }) });

    // Assert
    expect(requireServiceSupabase).not.toHaveBeenCalled();
    expect(imageResponses).toHaveLength(1);
  });
});
