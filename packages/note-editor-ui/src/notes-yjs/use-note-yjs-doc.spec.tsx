import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const persistenceSynced = { current: Promise.resolve() };
const destroyPersistence = vi.fn();
const destroyDoc = vi.fn();
const createNoteYjsDoc = vi.fn(() => ({
  doc: { destroy: destroyDoc },
  persistence: {
    get whenSynced() {
      return persistenceSynced.current;
    },
    destroy: destroyPersistence,
  },
}));
const connect = vi.fn().mockResolvedValue(undefined);
const destroyProvider = vi.fn();
// `new`-ed by the hook, so the mock has to be constructible.
const SupabaseYjsProvider = vi.fn(function (this: Record<string, unknown>) {
  this.connect = connect;
  this.destroy = destroyProvider;
});

vi.mock('./note-yjs-doc', () => ({ createNoteYjsDoc }));
vi.mock('./supabase-yjs-provider', () => ({ SupabaseYjsProvider }));
vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient: () => ({ client: 'browser' }),
}));

const { useNoteYjsDoc } = await import('./use-note-yjs-doc');

beforeEach(() => {
  vi.clearAllMocks();
  persistenceSynced.current = Promise.resolve();
  connect.mockResolvedValue(undefined);
});

describe('useNoteYjsDoc', () => {
  it('stays idle without entitlement, a note, or an actor', () => {
    // Arrange|Act
    const { result: unentitled } = renderHook(() =>
      useNoteYjsDoc('note-1', 'user-1', false),
    );
    const { result: noNote } = renderHook(() =>
      useNoteYjsDoc(null, 'user-1', true),
    );
    const { result: noActor } = renderHook(() =>
      useNoteYjsDoc('note-1', null, true),
    );

    // Assert — an unentitled reader has no cloud vault to sync with
    for (const result of [unentitled, noNote, noActor]) {
      expect(result.current).toEqual({ ydoc: null, synced: false });
    }
    expect(createNoteYjsDoc).not.toHaveBeenCalled();
  });

  it('binds the doc immediately but withholds synced until both loads finish', async () => {
    // Arrange
    let releaseLocal: () => void = () => undefined;
    persistenceSynced.current = new Promise<void>((resolve) => {
      releaseLocal = resolve;
    });

    // Act
    const { result } = renderHook(() =>
      useNoteYjsDoc('note-1', 'user-1', true),
    );

    // Assert — seeding before sync would duplicate the body
    expect(result.current.ydoc).not.toBeNull();
    expect(result.current.synced).toBe(false);
    releaseLocal();
    await waitFor(() => {
      expect(result.current.synced).toBe(true);
    });
  });

  it('connects the provider with the note and the Clerk actor', async () => {
    // Arrange|Act
    renderHook(() => useNoteYjsDoc('note-1', 'user-1', true));

    // Assert — the actor must match the Supabase JWT or RLS rejects the insert
    await waitFor(() => {
      expect(connect).toHaveBeenCalled();
    });
    expect(SupabaseYjsProvider).toHaveBeenCalledWith(expect.anything(), {
      client: { client: 'browser' },
      noteId: 'note-1',
      actor: 'user-1',
    });
  });

  it('tears the previous note down before binding the next', async () => {
    // Arrange
    const { rerender } = renderHook(
      ({ noteId }: { noteId: string }) => useNoteYjsDoc(noteId, 'user-1', true),
      { initialProps: { noteId: 'note-1' } },
    );
    await waitFor(() => {
      expect(connect).toHaveBeenCalled();
    });

    // Act
    rerender({ noteId: 'note-2' });

    // Assert
    expect(destroyProvider).toHaveBeenCalledTimes(1);
    expect(destroyPersistence).toHaveBeenCalledTimes(1);
    expect(destroyDoc).toHaveBeenCalledTimes(1);
    expect(createNoteYjsDoc).toHaveBeenLastCalledWith('note-2');
  });

  it('does not report synced for a note that was closed mid-connect', async () => {
    // Arrange
    let releaseConnect: () => void = () => undefined;
    connect.mockReturnValue(
      new Promise<void>((resolve) => {
        releaseConnect = resolve;
      }),
    );
    const { result, unmount } = renderHook(() =>
      useNoteYjsDoc('note-1', 'user-1', true),
    );

    // Act
    unmount();
    releaseConnect();
    await Promise.resolve();

    // Assert
    expect(result.current.synced).toBe(false);
    expect(destroyProvider).toHaveBeenCalled();
  });

  it('tears everything down on unmount', async () => {
    // Arrange
    const { unmount } = renderHook(() =>
      useNoteYjsDoc('note-1', 'user-1', true),
    );
    await waitFor(() => {
      expect(connect).toHaveBeenCalled();
    });

    // Act
    unmount();

    // Assert
    expect(destroyProvider).toHaveBeenCalled();
    expect(destroyPersistence).toHaveBeenCalled();
    expect(destroyDoc).toHaveBeenCalled();
  });
});
