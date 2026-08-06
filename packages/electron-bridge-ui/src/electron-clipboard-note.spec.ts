import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNoteFromMenubarClipboard } from './electron-clipboard-note';
import { navigateToScreen } from '@nota/app-navigation-core/navigation';
import { isLikelyOnline } from '@nota/data-source/notes-offline-sync';
import { createNote } from '@nota/data-source/models/notes';
import { createLocalOnlyNote } from '@nota/notes-offline';

vi.mock('@nota/app-navigation-core/navigation', () => ({
  navigateToScreen: vi.fn(),
}));

vi.mock('@nota/data-source/supabase/browser', () => ({
  getBrowserClient: () => ({}),
}));

vi.mock('@nota/data-source/notes-offline-sync', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@nota/data-source/notes-offline-sync')
    >();
  return { ...actual, isLikelyOnline: vi.fn() };
});

vi.mock('@nota/data-source/models/notes', () => ({
  createNote: vi.fn(),
  updateNote: vi.fn(),
}));

vi.mock('@nota/notes-offline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nota/notes-offline')>();
  return {
    ...actual,
    createLocalOnlyNote: vi.fn(() => Promise.resolve('local-1')),
  };
});

vi.mock('@nota/data-source/pdf-attachment-client', () => ({
  uploadNoteAttachmentFile: vi.fn(),
}));

describe('createNoteFromMenubarClipboard', () => {
  const insertNoteAtFront = vi.fn();
  const refreshNotesList = vi.fn(() => Promise.resolve());
  const patchNoteInList = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isLikelyOnline).mockReturnValue(true);
  });

  it('no-ops when not entitled', async () => {
    // Act
    await createNoteFromMenubarClipboard({
      userId: 'u1',
      notaProEntitled: false,
      clipboard: { kind: 'text', text: 'Hello' },
      insertNoteAtFront,
      refreshNotesList,
      patchNoteInList,
      onError,
    });

    // Assert
    expect(createNote).not.toHaveBeenCalled();
    expect(navigateToScreen).not.toHaveBeenCalled();
  });

  it('creates a remote note from plain text while online', async () => {
    // Arrange
    vi.mocked(createNote).mockResolvedValue({
      id: 'n1',
      user_id: 'u1',
      title: 'Hello',
      content: {},
      folder_id: null,
      created_at: '',
      updated_at: '',
      editor_settings: null,
      due_at: null,
      is_deadline: false,
      banner_attachment_id: null,
      share_token: null,
    });

    // Act
    await createNoteFromMenubarClipboard({
      userId: 'u1',
      notaProEntitled: true,
      clipboard: { kind: 'text', text: 'Hello\nWorld' },
      insertNoteAtFront,
      refreshNotesList,
      patchNoteInList,
      onError,
    });

    // Assert
    expect(createNote).toHaveBeenCalled();
    expect(insertNoteAtFront).toHaveBeenCalled();
    expect(navigateToScreen).toHaveBeenCalledWith({
      kind: 'notes',
      panel: 'note',
      noteId: 'n1',
    });
  });

  it('falls back to local note while offline for text clipboard', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(false);

    // Act
    await createNoteFromMenubarClipboard({
      userId: 'u1',
      notaProEntitled: true,
      clipboard: { kind: 'text', text: 'Offline' },
      insertNoteAtFront,
      refreshNotesList,
      patchNoteInList,
      onError,
    });

    // Assert
    expect(createLocalOnlyNote).toHaveBeenCalled();
    expect(createNote).not.toHaveBeenCalled();
    expect(navigateToScreen).toHaveBeenCalledWith({
      kind: 'notes',
      panel: 'note',
      noteId: 'local-1',
    });
  });

  it('errors when pasting an image offline', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(false);

    // Act
    await createNoteFromMenubarClipboard({
      userId: 'u1',
      notaProEntitled: true,
      clipboard: {
        kind: 'image',
        base64: 'abc',
        mimeType: 'image/png',
      },
      insertNoteAtFront,
      refreshNotesList,
      patchNoteInList,
      onError,
    });

    // Assert
    expect(onError).toHaveBeenCalledWith(
      'Pasting images requires an internet connection.',
    );
    expect(createNote).not.toHaveBeenCalled();
  });
});
