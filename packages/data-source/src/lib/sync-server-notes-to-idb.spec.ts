import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  syncServerNotesToIdbInChunks,
  NOTES_IDB_PUT_CHUNK_SIZE,
} from './sync-server-notes-to-idb';
import type { Note } from '@nota/database-types';

function mockNote(id: string): Note {
  return {
    id,
    user_id: 'u',
    title: 't',
    content: { type: 'doc', content: [] },
    created_at: '2020-01-01T00:00:00.000Z',
    updated_at: '2020-01-01T00:00:00.000Z',
    due_at: null,
    is_deadline: false,
    editor_settings: {},
    banner_attachment_id: null,
    folder_id: null,
    share_token: null,
  };
}

describe('syncServerNotesToIdbInChunks', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback): number => {
        queueMicrotask(() => {
          cb(performance.now());
        });
        return 1;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls put once per note across multiple chunks', async () => {
    // Arrange
    const count = NOTES_IDB_PUT_CHUNK_SIZE + 3;
    const notes = Array.from({ length: count }, (_, i) =>
      mockNote(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`),
    );
    const put = vi.fn(async () => undefined);
    const userId = 'user-1';

    // Act
    await syncServerNotesToIdbInChunks(userId, notes, put);

    // Assert
    expect(put).toHaveBeenCalledTimes(count);
  });

  it('does nothing for an empty list', async () => {
    // Arrange
    const put = vi.fn(async () => undefined);
    const userId = 'user-1';

    // Act
    await syncServerNotesToIdbInChunks(userId, [], put);

    // Assert
    expect(put).not.toHaveBeenCalled();
  });
});
