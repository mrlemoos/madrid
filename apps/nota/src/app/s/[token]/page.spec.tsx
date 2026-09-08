import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchSharedNote = vi.fn();
const fetchSharedNoteAttachments = vi.fn();

vi.mock('@getmadrid/data-source/note-share-client', () => ({
  fetchSharedNote,
  fetchSharedNoteAttachments,
}));
vi.mock('@/shared-note-view', () => ({
  SharedNoteView: () => null,
}));

const page = await import('./page');

const NOTE = {
  id: 'note-1',
  title: 'Boarding pass',
  content: { type: 'doc' },
  editorSettings: {},
  authorDisplayName: 'Leonardo',
  updatedAt: '2026-03-04T10:00:00.000Z',
};

function params(token: string) {
  return { params: Promise.resolve({ token }) };
}

/** The page returns the viewer element; read the props it was given. */
async function renderPage(token: string) {
  const element = await page.default(params(token));
  return element.props as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchSharedNote.mockResolvedValue(NOTE);
  fetchSharedNoteAttachments.mockResolvedValue([{ id: 'att-1' }]);
});

describe('SharedNotePage', () => {
  it('reads the note on the server so the HTML is not a spinner', async () => {
    // Arrange|Act
    const props = await renderPage('tok');

    // Assert
    expect(props).toMatchObject({
      token: 'tok',
      initialNote: NOTE,
      initialAttachments: [{ id: 'att-1' }],
      loadError: null,
    });
  });

  it('hands the viewer a load error rather than throwing', async () => {
    // Arrange
    fetchSharedNote.mockRejectedValue(new Error('Supabase blip'));

    // Act
    const props = await renderPage('tok');

    // Assert
    expect(props).toMatchObject({
      initialNote: null,
      loadError: 'Supabase blip',
    });
  });

  it('renders the note even when its attachments cannot be listed', async () => {
    // Arrange
    fetchSharedNoteAttachments.mockRejectedValue(new Error('rls'));

    // Act
    const props = await renderPage('tok');

    // Assert — individual nodes render their own unavailable state
    expect(props).toMatchObject({
      initialNote: NOTE,
      initialAttachments: [],
      loadError: null,
    });
  });

  it('does not look up attachments for a token that shares nothing', async () => {
    // Arrange
    fetchSharedNote.mockResolvedValue(null);

    // Act
    const props = await renderPage('tok');

    // Assert
    expect(props?.initialNote).toBeNull();
    expect(fetchSharedNoteAttachments).not.toHaveBeenCalled();
  });

  it('does not hit the database for an empty token', async () => {
    // Arrange|Act
    const props = await renderPage('');

    // Assert
    expect(fetchSharedNote).not.toHaveBeenCalled();
    expect(props?.initialNote).toBeNull();
  });

  it('exposes the shared loader that metadata and the page both call', async () => {
    // Arrange|Act — `cache()` dedupes it per request; supabase-js is not `fetch`,
    // so Next has no request-level dedupe of its own to lean on
    const note = await page.loadSharedNote('same-token');

    // Assert
    expect(note).toEqual(NOTE);
    expect(fetchSharedNote).toHaveBeenCalledWith('same-token');
  });

  it('short-circuits the shared loader on an empty token', async () => {
    // Arrange|Act
    const note = await page.loadSharedNote('');

    // Assert
    expect(note).toBeNull();
    expect(fetchSharedNote).not.toHaveBeenCalled();
  });
});

describe('generateMetadata', () => {
  it('titles the unfurl with the note and keeps it out of search', async () => {
    // Arrange|Act
    const metadata = await page.generateMetadata(params('meta-token'));

    // Assert — share tokens cannot be revoked, so an indexed note is public forever
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.openGraph?.siteName).toBe('Madrid');
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(String(metadata.title)).toContain('Boarding pass');
  });

  it('never throws, so a failed read cannot 500 the page', async () => {
    // Arrange
    fetchSharedNote.mockRejectedValue(new Error('Supabase blip'));

    // Act
    const metadata = await page.generateMetadata(params('failing-token'));

    // Assert
    expect(metadata.title).toBeTruthy();
  });
});

describe('revalidate', () => {
  it('lets the unfurl lag a live edit rather than re-rendering per crawl', () => {
    // Arrange|Act|Assert
    expect(page.revalidate).toBe(300);
  });
});
