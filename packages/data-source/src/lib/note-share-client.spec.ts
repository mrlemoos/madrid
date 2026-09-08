import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

const rpc = vi.fn();
const channelOn = vi.fn();
const subscribe = vi.fn();
const removeChannel = vi.fn();
const channel = vi.fn();
const envValue = { origin: undefined as string | undefined };

vi.mock('@getmadrid/env-nextjs', () => ({
  env: (key: string) =>
    key === 'NEXT_PUBLIC_NOTA_WEB_APP_ORIGIN' ? envValue.origin : undefined,
}));
vi.mock('./supabase/anon', () => ({
  getSupabaseAnonClient: () => ({ rpc, channel, removeChannel }),
}));

const {
  buildShareUrl,
  fetchSharedNote,
  fetchSharedNoteAttachments,
  shareNote,
  SHARED_NOTE_PATH_PREFIX,
  subscribeSharedNote,
} = await import('./note-share-client');

beforeEach(() => {
  envValue.origin = undefined;
  rpc.mockReset();
  channel.mockReset();
  channelOn.mockReset();
  subscribe.mockReset();
  removeChannel.mockReset();
  channel.mockReturnValue({ on: channelOn });
  channelOn.mockReturnValue({ subscribe });
  subscribe.mockReturnValue('channel-handle');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildShareUrl', () => {
  it('prefers the configured web app origin', () => {
    // Arrange
    envValue.origin = 'https://app.example.com/';

    // Act|Assert — the trailing slash must not double up
    expect(buildShareUrl('abc')).toBe('https://app.example.com/s/abc');
  });

  it('falls back to the current origin on the web', () => {
    // Arrange|Act|Assert
    expect(buildShareUrl('abc')).toBe(`${window.location.origin}/s/abc`);
  });

  it('nests share links under the public prefix', () => {
    // Arrange|Act|Assert
    expect(SHARED_NOTE_PATH_PREFIX).toBe('/s/');
    expect(buildShareUrl('abc')).toContain(SHARED_NOTE_PATH_PREFIX);
  });
});

describe('shareNote', () => {
  function clientWithUpdate(error: { message: string } | null) {
    const eq = vi.fn().mockResolvedValue({ error });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    return { client: { from } as unknown as SupabaseClient, from, update, eq };
  }

  it('reuses an existing token instead of minting a second one', async () => {
    // Arrange
    const { client, from } = clientWithUpdate(null);

    // Act
    const result = await shareNote(client, 'note-1', 'tok-existing');

    // Assert
    expect(from).not.toHaveBeenCalled();
    expect(result).toEqual({
      token: 'tok-existing',
      url: buildShareUrl('tok-existing'),
    });
  });

  it('mints an unguessable token and writes it to the note row', async () => {
    // Arrange
    const { client, from, update, eq } = clientWithUpdate(null);

    // Act
    const result = await shareNote(client, 'note-1');

    // Assert
    expect(from).toHaveBeenCalledWith('notes');
    expect(update).toHaveBeenCalledWith({ share_token: result.token });
    expect(eq).toHaveBeenCalledWith('id', 'note-1');
    expect(result.token).toMatch(/^[0-9a-f]{32}$/);
    expect(result.url).toBe(buildShareUrl(result.token));
  });

  it('surfaces an RLS rejection instead of returning a dead link', async () => {
    // Arrange
    const { client } = clientWithUpdate({ message: 'row-level security' });

    // Act|Assert
    await expect(shareNote(client, 'note-1')).rejects.toThrow(
      'Failed to share note: row-level security',
    );
  });
});

describe('fetchSharedNote', () => {
  it('maps the RPC row onto the viewer-facing shape', async () => {
    // Arrange
    rpc.mockReturnValue({
      maybeSingle: () =>
        Promise.resolve({
          data: {
            id: 'note-1',
            title: 'Quiet software',
            content: { type: 'doc' },
            editor_settings: { showInNoteGraph: true },
            author_display_name: 'Leonardo',
            updated_at: '2026-03-04T10:00:00Z',
          },
          error: null,
        }),
    });

    // Act
    const note = await fetchSharedNote('tok');

    // Assert
    expect(rpc).toHaveBeenCalledWith('get_shared_note', { p_token: 'tok' });
    expect(note).toEqual({
      id: 'note-1',
      title: 'Quiet software',
      content: { type: 'doc' },
      editorSettings: { showInNoteGraph: true },
      authorDisplayName: 'Leonardo',
      updatedAt: '2026-03-04T10:00:00Z',
    });
  });

  it('returns null for a token that shares nothing', async () => {
    // Arrange
    rpc.mockReturnValue({
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    });

    // Act|Assert
    await expect(fetchSharedNote('tok')).resolves.toBeNull();
  });

  it('reports an RPC failure', async () => {
    // Arrange
    rpc.mockReturnValue({
      maybeSingle: () =>
        Promise.resolve({ data: null, error: { message: 'boom' } }),
    });

    // Act|Assert
    await expect(fetchSharedNote('tok')).rejects.toThrow(
      'Failed to load shared note: boom',
    );
  });
});

describe('fetchSharedNoteAttachments', () => {
  it('returns the attachment rows for the token', async () => {
    // Arrange
    const rows = [{ id: 'att-1', note_id: 'note-1' }];
    rpc.mockResolvedValue({ data: rows, error: null });

    // Act
    const result = await fetchSharedNoteAttachments('tok');

    // Assert
    expect(rpc).toHaveBeenCalledWith('get_shared_note_attachments', {
      p_token: 'tok',
    });
    expect(result).toEqual(rows);
  });

  it('returns an empty list when the note has no attachments', async () => {
    // Arrange
    rpc.mockResolvedValue({ data: null, error: null });

    // Act|Assert
    await expect(fetchSharedNoteAttachments('tok')).resolves.toEqual([]);
  });

  it('reports an RPC failure', async () => {
    // Arrange
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

    // Act|Assert
    await expect(fetchSharedNoteAttachments('tok')).rejects.toThrow(
      'Failed to load shared note attachments: boom',
    );
  });
});

describe('subscribeSharedNote', () => {
  it('listens on the public topic for the token', () => {
    // Arrange
    const onUpdate = vi.fn();

    // Act
    subscribeSharedNote('tok', onUpdate);

    // Assert
    expect(channel).toHaveBeenCalledWith('share:tok', {
      config: { private: false },
    });
    expect(channelOn).toHaveBeenCalledWith(
      'broadcast',
      { event: 'update' },
      expect.any(Function),
    );
  });

  it('calls back when the owner edits the note', () => {
    // Arrange
    const onUpdate = vi.fn();
    subscribeSharedNote('tok', onUpdate);

    // Act
    (channelOn.mock.calls[0]?.[2] as () => void)();

    // Assert
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('removes the channel when the viewer leaves', () => {
    // Arrange
    const unsubscribe = subscribeSharedNote('tok', vi.fn());

    // Act
    unsubscribe();

    // Assert
    expect(removeChannel).toHaveBeenCalledWith('channel-handle');
  });
});
