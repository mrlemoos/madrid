import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

const createNote = vi.fn();
const createLocalOnlyNote = vi.fn();
const isLikelyOnline = vi.fn(() => true);
const getBrowserClient = vi.fn(() => ({ client: 'browser' }));
const storeState = {
  dailyNoteIdByLocalDate: {} as Record<string, string>,
  clearDailyNoteForLocalDate: vi.fn(),
  setDailyNoteForLocalDate: vi.fn(),
};

vi.mock('@getmadrid/data-source/models/notes', () => ({ createNote }));
vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient,
}));
vi.mock('@getmadrid/notes-offline', () => ({ createLocalOnlyNote }));
vi.mock('@getmadrid/data-source/notes-offline-sync', () => ({
  isLikelyOnline,
}));
vi.mock('@getmadrid/note-runtime/stores/preferences', () => ({
  useNotaPreferencesStore: { getState: () => storeState },
}));

const { ensureTodaysRootNoteId, openTodaysNoteClient } = await import(
  './open-todays-note'
);
const { dailyNoteDisplayTitle, localDateKey } = await import(
  '@getmadrid/app-navigation-core/todays-note'
);

const TODAY_KEY = localDateKey(new Date());
const TODAY_TITLE = dailyNoteDisplayTitle(new Date());

function note(id: string, title: string, folder_id: string | null = null) {
  return { id, title, folder_id } as unknown as Pick<Note, 'id' | 'folder_id'>;
}

beforeEach(() => {
  vi.clearAllMocks();
  isLikelyOnline.mockReturnValue(true);
  getBrowserClient.mockReturnValue({ client: 'browser' });
  createNote.mockResolvedValue({ id: 'note-server' });
  createLocalOnlyNote.mockResolvedValue('note-local');
  storeState.dailyNoteIdByLocalDate = {};
});

describe('ensureTodaysRootNoteId', () => {
  it('creates nothing for a reader without Madrid Pro', async () => {
    // Arrange|Act
    const id = await ensureTodaysRootNoteId({
      notes: [],
      userId: 'user-1',
      notaProEntitled: false,
    });

    // Assert
    expect(id).toBeNull();
    expect(createNote).not.toHaveBeenCalled();
    expect(createLocalOnlyNote).not.toHaveBeenCalled();
  });

  it('reuses today’s note when one already exists', async () => {
    // Arrange
    storeState.dailyNoteIdByLocalDate = { [TODAY_KEY]: 'note-today' };

    // Act
    const id = await ensureTodaysRootNoteId({
      notes: [note('note-today', TODAY_TITLE)],
      userId: 'user-1',
      notaProEntitled: true,
    });

    // Assert
    expect(id).toBe('note-today');
    expect(createNote).not.toHaveBeenCalled();
  });

  it('creates a root note titled with the local date when online', async () => {
    // Arrange|Act
    const id = await ensureTodaysRootNoteId({
      notes: [],
      userId: 'user-1',
      notaProEntitled: true,
    });

    // Assert
    expect(createNote).toHaveBeenCalledWith(
      { client: 'browser' },
      'user-1',
      TODAY_TITLE,
      undefined,
      { folder_id: null },
    );
    expect(id).toBe('note-server');
    expect(storeState.setDailyNoteForLocalDate).toHaveBeenCalledWith(
      TODAY_KEY,
      'note-server',
    );
  });

  it('creates the note locally while offline', async () => {
    // Arrange
    isLikelyOnline.mockReturnValue(false);

    // Act
    const id = await ensureTodaysRootNoteId({
      notes: [],
      userId: 'user-1',
      notaProEntitled: true,
    });

    // Assert
    expect(createNote).not.toHaveBeenCalled();
    expect(createLocalOnlyNote).toHaveBeenCalledWith(
      'user-1',
      TODAY_TITLE,
      undefined,
      null,
    );
    expect(id).toBe('note-local');
  });

  it('falls back to a local note when the server write fails', async () => {
    // Arrange
    createNote.mockRejectedValue(new Error('offline mid-flight'));

    // Act
    const id = await ensureTodaysRootNoteId({
      notes: [],
      userId: 'user-1',
      notaProEntitled: true,
    });

    // Assert — the reader still gets today's note
    expect(id).toBe('note-local');
  });

  it('forgets a stale mapping before creating a replacement', async () => {
    // Arrange — the store points at a note that no longer exists
    storeState.dailyNoteIdByLocalDate = { [TODAY_KEY]: 'note-deleted' };

    // Act
    await ensureTodaysRootNoteId({
      notes: [],
      userId: 'user-1',
      notaProEntitled: true,
    });

    // Assert
    expect(storeState.clearDailyNoteForLocalDate).toHaveBeenCalledWith(
      TODAY_KEY,
    );
  });
});

describe('openTodaysNoteClient', () => {
  it('navigates to the note and refreshes the vault list', async () => {
    // Arrange
    const navigate = vi.fn();
    const revalidate = vi.fn();

    // Act
    await openTodaysNoteClient({
      notes: [],
      userId: 'user-1',
      navigate,
      revalidate,
      notaProEntitled: true,
    });

    // Assert
    expect(navigate).toHaveBeenCalledWith('/notes/note-server');
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a reader without Madrid Pro', async () => {
    // Arrange
    const navigate = vi.fn();
    const revalidate = vi.fn();

    // Act
    await openTodaysNoteClient({
      notes: [],
      userId: 'user-1',
      navigate,
      revalidate,
      notaProEntitled: false,
    });

    // Assert
    expect(navigate).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
