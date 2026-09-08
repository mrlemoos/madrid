import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@getmadrid/database-types';

const navigateToScreen = vi.fn();
const createNote = vi.fn();
const createLocalOnlyNote = vi.fn();
const isLikelyOnline = vi.fn(() => true);
const beginSession = vi.fn();
const studyNotePlaceholderRecordingTitle = vi.fn(() => 'Recording…');

vi.mock('@getmadrid/app-navigation-core/navigation', () => ({
  navigateToScreen,
}));
vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  getBrowserClient: () => ({ client: 'browser' }),
}));
vi.mock('@getmadrid/notes-offline', () => ({ createLocalOnlyNote }));
vi.mock('@getmadrid/data-source/notes-offline-sync', () => ({
  isLikelyOnline,
}));
vi.mock('@getmadrid/data-source/models/notes', () => ({ createNote }));
vi.mock('@getmadrid/note-runtime/stores/audio-session', () => ({
  useAudioToNoteSession: { getState: () => ({ beginSession }) },
}));
vi.mock('@getmadrid/note-capture-core/study-note-title', () => ({
  studyNotePlaceholderRecordingTitle,
}));

const { startStudyNotesAppendToOpenNote, startStudyNotesFromRecording } =
  await import('./audio-to-note-start');

const serverRow = { id: 'note-server' } as Note;

function options(
  overrides: Partial<Parameters<typeof startStudyNotesFromRecording>[0]> = {},
) {
  return {
    userId: 'user-1',
    notaProEntitled: true,
    insertNoteAtFront: vi.fn(),
    refreshNotesList: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  isLikelyOnline.mockReturnValue(true);
  createNote.mockResolvedValue(serverRow);
  createLocalOnlyNote.mockResolvedValue('note-local');
  studyNotePlaceholderRecordingTitle.mockReturnValue('Recording…');
});

describe('startStudyNotesFromRecording', () => {
  it('does nothing without Madrid Pro', async () => {
    // Arrange|Act
    await startStudyNotesFromRecording(options({ notaProEntitled: false }));

    // Assert
    expect(createNote).not.toHaveBeenCalled();
    expect(beginSession).not.toHaveBeenCalled();
  });

  it('does nothing while signed out', async () => {
    // Arrange|Act
    await startStudyNotesFromRecording(options({ userId: '' }));

    // Assert
    expect(beginSession).not.toHaveBeenCalled();
  });

  it('creates the note on the server, opens it, then starts capture', async () => {
    // Arrange
    const opts = options();

    // Act
    await startStudyNotesFromRecording(opts);

    // Assert
    expect(createNote).toHaveBeenCalledWith(
      { client: 'browser' },
      'user-1',
      'Recording…',
    );
    expect(opts.insertNoteAtFront).toHaveBeenCalledWith(serverRow);
    expect(navigateToScreen).toHaveBeenCalledWith({
      kind: 'notes',
      panel: 'note',
      noteId: 'note-server',
    });
    expect(opts.refreshNotesList).toHaveBeenCalledWith({ silent: true });
    expect(beginSession).toHaveBeenCalledWith('note-server');
  });

  it('captures into a local-only note while offline', async () => {
    // Arrange
    isLikelyOnline.mockReturnValue(false);
    const opts = options();

    // Act
    await startStudyNotesFromRecording(opts);

    // Assert
    expect(createNote).not.toHaveBeenCalled();
    expect(createLocalOnlyNote).toHaveBeenCalledWith('user-1', 'Recording…');
    expect(opts.insertNoteAtFront).not.toHaveBeenCalled();
    expect(beginSession).toHaveBeenCalledWith('note-local');
  });

  it('falls back to a local note when the server write fails mid-flight', async () => {
    // Arrange
    createNote.mockRejectedValue(new Error('dropped connection'));

    // Act
    await startStudyNotesFromRecording(options());

    // Assert — the reader still gets a note to record into
    expect(beginSession).toHaveBeenCalledWith('note-local');
    expect(navigateToScreen).toHaveBeenCalledWith({
      kind: 'notes',
      panel: 'note',
      noteId: 'note-local',
    });
  });
});

describe('startStudyNotesAppendToOpenNote', () => {
  it('captures into the open note without replacing its title', () => {
    // Arrange|Act
    startStudyNotesAppendToOpenNote({
      userId: 'user-1',
      notaProEntitled: true,
      openNoteId: 'note-1',
    });

    // Assert
    expect(beginSession).toHaveBeenCalledWith('note-1', { append: true });
  });

  it('does nothing without Pro, a session, or an open note', () => {
    // Arrange|Act
    startStudyNotesAppendToOpenNote({
      userId: 'user-1',
      notaProEntitled: false,
      openNoteId: 'note-1',
    });
    startStudyNotesAppendToOpenNote({
      userId: '',
      notaProEntitled: true,
      openNoteId: 'note-1',
    });
    startStudyNotesAppendToOpenNote({
      userId: 'user-1',
      notaProEntitled: true,
      openNoteId: '',
    });

    // Assert
    expect(beginSession).not.toHaveBeenCalled();
  });
});
