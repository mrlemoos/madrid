import { beforeEach, describe, expect, it } from 'vitest';

import { useAudioToNoteSession } from './audio-to-note-session';

const INITIAL = useAudioToNoteSession.getState();

beforeEach(() => {
  useAudioToNoteSession.setState({
    recordingSessionId: 0,
    phase: 'idle',
    noteId: null,
    appendToExisting: false,
    streamPreview: '',
    error: null,
    statusLine: '',
    recordingAttachmentWarning: null,
  });
});

describe('audio-to-note session', () => {
  it('starts idle with nothing captured', () => {
    // Arrange|Act
    const state = useAudioToNoteSession.getState();

    // Assert
    expect(state.phase).toBe('idle');
    expect(state.noteId).toBeNull();
    expect(state.streamPreview).toBe('');
  });

  it('begins recording against a note and asks for the microphone', () => {
    // Arrange|Act
    INITIAL.beginSession('note-1');

    // Assert
    const state = useAudioToNoteSession.getState();
    expect(state.phase).toBe('recording');
    expect(state.noteId).toBe('note-1');
    expect(state.appendToExisting).toBe(false);
    expect(state.statusLine).toBe('Requesting microphone…');
  });

  it('remembers when the capture should append rather than replace', () => {
    // Arrange|Act
    INITIAL.beginSession('note-1', { append: true });

    // Assert — append keeps the existing title and merges into the body
    expect(useAudioToNoteSession.getState().appendToExisting).toBe(true);
  });

  it('bumps the session id on every recording, so stale results can be dropped', () => {
    // Arrange
    INITIAL.beginSession('note-1');
    const first = useAudioToNoteSession.getState().recordingSessionId;

    // Act
    INITIAL.beginSession('note-2');

    // Assert
    expect(useAudioToNoteSession.getState().recordingSessionId).toBe(first + 1);
  });

  it('clears a previous error and preview when a new recording starts', () => {
    // Arrange
    INITIAL.setError('microphone blocked');
    INITIAL.appendPreview('stale');

    // Act
    INITIAL.beginSession('note-1');

    // Assert
    const state = useAudioToNoteSession.getState();
    expect(state.error).toBeNull();
    expect(state.streamPreview).toBe('');
  });

  it('accumulates the streamed transcript', () => {
    // Arrange|Act
    INITIAL.appendPreview('the quiet ');
    INITIAL.appendPreview('part');

    // Assert
    expect(useAudioToNoteSession.getState().streamPreview).toBe(
      'the quiet part',
    );
  });

  it('drops the preview when processing takes over from recording', () => {
    // Arrange
    INITIAL.beginSession('note-1');
    INITIAL.appendPreview('draft');

    // Act
    INITIAL.setProcessing('Transcribing…');

    // Assert
    const state = useAudioToNoteSession.getState();
    expect(state.phase).toBe('processing');
    expect(state.statusLine).toBe('Transcribing…');
    expect(state.streamPreview).toBe('');
  });

  it('shows the error instead of a status line when capture fails', () => {
    // Arrange
    INITIAL.setProcessing('Transcribing…');

    // Act
    INITIAL.setError('upload failed');

    // Assert
    const state = useAudioToNoteSession.getState();
    expect(state.phase).toBe('error');
    expect(state.error).toBe('upload failed');
    expect(state.statusLine).toBe('');
  });

  it('carries an attachment warning without failing the session', () => {
    // Arrange
    INITIAL.beginSession('note-1');

    // Act
    INITIAL.setRecordingAttachmentWarning('Recording could not be uploaded');

    // Assert — the study notes still saved, so the phase must not become error
    const state = useAudioToNoteSession.getState();
    expect(state.recordingAttachmentWarning).toBe(
      'Recording could not be uploaded',
    );
    expect(state.phase).toBe('recording');
  });

  it('resets everything but the session counter', () => {
    // Arrange
    INITIAL.beginSession('note-1', { append: true });
    INITIAL.setError('boom');
    const sessionId = useAudioToNoteSession.getState().recordingSessionId;

    // Act
    INITIAL.reset();

    // Assert — the counter must keep rising or a stale result could be accepted
    const state = useAudioToNoteSession.getState();
    expect(state).toMatchObject({
      phase: 'idle',
      noteId: null,
      appendToExisting: false,
      streamPreview: '',
      error: null,
      statusLine: '',
      recordingAttachmentWarning: null,
    });
    expect(state.recordingSessionId).toBe(sessionId);
  });
});
