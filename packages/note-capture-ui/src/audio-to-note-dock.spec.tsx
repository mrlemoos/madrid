import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioToNoteSession } from '@getmadrid/note-runtime/stores/audio-session';

const postAudioToNoteStream = vi.fn();
const applyAudioNoteStudyResult = vi.fn().mockResolvedValue(undefined);
const uploadStudyRecordingAttachment = vi.fn();
const isLikelyOnline = vi.fn(() => true);
const saveLocalNoteDraft = vi.fn().mockResolvedValue(undefined);
const enqueuePendingAudioNoteJob = vi.fn().mockResolvedValue('job-1');
const patchNoteInList = vi.fn();
const refreshNotesList = vi.fn().mockResolvedValue(undefined);

vi.mock('@getmadrid/note-runtime/session-context', () => ({
  useRootLoaderData: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@getmadrid/note-runtime/notes-data-context', () => ({
  useNotesDataActions: () => ({ patchNoteInList, refreshNotesList }),
}));
vi.mock('./audio-to-note-client', () => ({ postAudioToNoteStream }));
vi.mock('./audio-to-note-apply', () => ({ applyAudioNoteStudyResult }));
vi.mock('@getmadrid/data-source/pdf-attachment-client', () => ({
  uploadStudyRecordingAttachment,
}));
vi.mock('@getmadrid/data-source/notes-offline-sync', () => ({
  isLikelyOnline,
}));
vi.mock('@getmadrid/notes-offline', () => ({ saveLocalNoteDraft }));
vi.mock('./audio-note-pending-idb', () => ({ enqueuePendingAudioNoteJob }));

const { AudioToNoteDock } = await import('./audio-to-note-dock');

/** A MediaRecorder that records how it was driven and can be stopped by hand. */
function installRecorder(options: { canPause?: boolean } = {}) {
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] };
  const state = { current: 'recording' as string };
  const recorder = {
    mimeType: 'audio/webm',
    ondataavailable: null as ((e: { data: Blob }) => void) | null,
    onstop: null as (() => void) | null,
    get state() {
      return state.current;
    },
    start: vi.fn(),
    stop: vi.fn(function (this: { onstop: (() => void) | null }) {
      state.current = 'inactive';
      this.onstop?.();
    }),
    ...(options.canPause === false
      ? {}
      : {
          pause: vi.fn(() => {
            state.current = 'paused';
          }),
          resume: vi.fn(() => {
            state.current = 'recording';
          }),
        }),
  };

  class FakeMediaRecorder {
    static isTypeSupported = () => true;
    constructor() {
      return recorder as unknown as MediaRecorder;
    }
  }
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
  });
  return { recorder, track };
}

async function startRecording(
  noteId = 'note-1',
  options?: { append: boolean },
) {
  render(<AudioToNoteDock />);
  await act(async () => {
    useAudioToNoteSession.getState().beginSession(noteId, options);
    await Promise.resolve();
  });
  await screen.findByRole('region', {
    name: 'Assistive study notes from recording',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isLikelyOnline.mockReturnValue(true);
  postAudioToNoteStream.mockResolvedValue({ title: 'Lecture', blocks: [] });
  uploadStudyRecordingAttachment.mockResolvedValue({
    id: 'att-1',
    filename: 'capture.webm',
  });
  act(() => {
    useAudioToNoteSession.getState().reset();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AudioToNoteDock', () => {
  it('stays out of the way while idle', () => {
    // Arrange|Act
    const { container } = render(<AudioToNoteDock />);

    // Assert
    expect(container.firstElementChild).toBeNull();
  });

  it('opens the microphone and offers the recording controls', async () => {
    // Arrange
    const { recorder } = installRecorder();

    // Act
    await startRecording();

    // Assert
    await waitFor(() => {
      expect(recorder.start).toHaveBeenCalledWith(1000);
    });
    expect(
      screen.getByRole('button', {
        name: 'Stop recording and generate study notes',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Cancel recording without saving' }),
    ).toBeTruthy();
  });

  it('reports a refused microphone instead of recording silence', async () => {
    // Arrange
    installRecorder();
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    // Act
    await startRecording();

    // Assert
    expect(await screen.findByText('Permission denied')).toBeTruthy();
  });

  it('pauses and resumes when the recorder supports it', async () => {
    // Arrange
    const { recorder } = installRecorder();
    await startRecording();
    const pause = await screen.findByRole('button', {
      name: 'Pause recording',
    });

    // Act
    fireEvent.click(pause);

    // Assert
    expect(recorder.pause).toHaveBeenCalled();
    const resume = await screen.findByRole('button', {
      name: 'Resume recording',
    });
    fireEvent.click(resume);
    expect(recorder.resume).toHaveBeenCalled();
  });

  it('hides the pause control when the recorder cannot pause', async () => {
    // Arrange
    installRecorder({ canPause: false });

    // Act
    await startRecording();

    // Assert
    await screen.findByRole('button', {
      name: 'Stop recording and generate study notes',
    });
    expect(
      screen.queryByRole('button', { name: 'Pause recording' }),
    ).toBeNull();
  });

  it('runs the pipeline and applies the notes on stop', async () => {
    // Arrange
    installRecorder();
    await startRecording();
    await screen.findByRole('button', {
      name: 'Stop recording and generate study notes',
    });

    // Act
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Stop recording and generate study notes',
        }),
      );
      await Promise.resolve();
    });

    // Assert
    await waitFor(() => {
      expect(applyAudioNoteStudyResult).toHaveBeenCalledWith(
        expect.objectContaining({
          noteId: 'note-1',
          userId: 'user-1',
          mode: 'replace',
          recording: { attachmentId: 'att-1', filename: 'capture.webm' },
        }),
      );
    });
    expect(useAudioToNoteSession.getState().phase).toBe('idle');
  });

  it('merges into the open note when the session was started to append', async () => {
    // Arrange
    installRecorder();
    await startRecording('note-1', { append: true });
    await screen.findByRole('button', {
      name: 'Stop recording and generate study notes',
    });

    // Act
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Stop recording and generate study notes',
        }),
      );
      await Promise.resolve();
    });

    // Assert
    await waitFor(() => {
      expect(applyAudioNoteStudyResult).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'append' }),
      );
    });
  });

  it('still saves the notes when the recording upload fails, and warns', async () => {
    // Arrange
    installRecorder();
    uploadStudyRecordingAttachment.mockRejectedValue(new Error('too large'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await startRecording();
    await screen.findByRole('button', {
      name: 'Stop recording and generate study notes',
    });

    // Act
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Stop recording and generate study notes',
        }),
      );
      await Promise.resolve();
    });

    // Assert
    await waitFor(() => {
      expect(applyAudioNoteStudyResult).toHaveBeenCalledWith(
        expect.objectContaining({ recording: undefined }),
      );
    });
    expect(
      useAudioToNoteSession.getState().recordingAttachmentWarning,
    ).not.toBeNull();
  });

  it('queues the recording for later while offline', async () => {
    // Arrange
    installRecorder();
    isLikelyOnline.mockReturnValue(false);
    await startRecording();
    await screen.findByRole('button', {
      name: 'Stop recording and generate study notes',
    });

    // Act
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Stop recording and generate study notes',
        }),
      );
      await Promise.resolve();
    });

    // Assert — the audio must survive, and the note says it is waiting
    await waitFor(() => {
      expect(enqueuePendingAudioNoteJob).toHaveBeenCalledWith(
        expect.objectContaining({ noteId: 'note-1', userId: 'user-1' }),
      );
    });
    expect(postAudioToNoteStream).not.toHaveBeenCalled();
    expect(saveLocalNoteDraft).toHaveBeenCalled();
  });

  it('reports a failed transcription', async () => {
    // Arrange
    installRecorder();
    postAudioToNoteStream.mockRejectedValue(new Error('Madrid Pro required'));
    await startRecording();
    await screen.findByRole('button', {
      name: 'Stop recording and generate study notes',
    });

    // Act
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'Stop recording and generate study notes',
        }),
      );
      await Promise.resolve();
    });

    // Assert
    expect(await screen.findByText('Madrid Pro required')).toBeTruthy();
  });

  it('throws the audio away on cancel', async () => {
    // Arrange
    installRecorder();
    await startRecording();
    const cancel = await screen.findByRole('button', {
      name: 'Cancel recording without saving',
    });

    // Act
    await act(async () => {
      fireEvent.click(cancel);
      await Promise.resolve();
    });

    // Assert
    expect(postAudioToNoteStream).not.toHaveBeenCalled();
    expect(enqueuePendingAudioNoteJob).not.toHaveBeenCalled();
    expect(useAudioToNoteSession.getState().phase).toBe('idle');
  });

  it('lets the reader dismiss an error', async () => {
    // Arrange
    render(<AudioToNoteDock />);
    act(() => {
      useAudioToNoteSession.getState().setError('Microphone blocked');
    });

    // Act
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));

    // Assert
    expect(useAudioToNoteSession.getState().phase).toBe('idle');
  });

  it('marks itself busy and streams the transcript while processing', async () => {
    // Arrange
    render(<AudioToNoteDock />);

    // Act
    act(() => {
      useAudioToNoteSession.getState().beginSession('note-1');
      useAudioToNoteSession.getState().setProcessing('Transcribing…');
      useAudioToNoteSession.getState().appendPreview('the quiet part');
    });

    // Assert
    const dock = await screen.findByRole('region', {
      name: 'Assistive study notes from recording',
    });
    expect(dock.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('the quiet part')).toBeTruthy();
  });

  it('releases the microphone on unmount', async () => {
    // Arrange
    const { track } = installRecorder();
    render(<AudioToNoteDock />);
    await act(async () => {
      useAudioToNoteSession.getState().beginSession('note-1');
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByRole('region')).toBeTruthy();
    });

    // Act
    act(() => {
      useAudioToNoteSession.getState().reset();
    });

    // Assert — a live mic track keeps the recording indicator on
    await waitFor(() => {
      expect(track.stop).toHaveBeenCalled();
    });
  });
});
