import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingAudioNoteJob } from './audio-note-pending-idb';
import type { AudioNoteStudyResult } from '@nota/note-capture-core/audio-note-blocks-to-doc';
import { useAudioNotePendingDrain } from './use-audio-note-pending-drain';
import { useAudioToNoteSession } from '@nota/note-runtime/stores/audio-session';

const studyResult: AudioNoteStudyResult = {
  title: 'Study',
  blocks: [{ type: 'paragraph', text: 'Hello' }],
};

const drainMocks = vi.hoisted(() => {
  const useRootLoaderData = vi.fn(() => ({
    user: { id: 'user-1', email: null as string | null },
  }));
  const useNotesDataMeta = vi.fn(() => ({
    notaProEntitled: true,
    loading: false,
    userPreferences: null,
    loadError: undefined as string | undefined,
  }));
  const patchNoteInList = vi.fn();
  const refreshNotesList = vi.fn(async () => {});
  const useNotesDataActions = vi.fn(() => ({
    patchNoteInList,
    refreshNotesList,
    removeNoteFromList: vi.fn(),
    insertNoteAtFront: vi.fn(),
    insertFolderSorted: vi.fn(),
    removeFolderFromList: vi.fn(),
    patchFolderInList: vi.fn(),
    setUserPreferencesInState: vi.fn(),
  }));
  const isLikelyOnline = vi.fn(() => true);
  const listPendingAudioNoteJobs = vi.fn(
    async () => [] as PendingAudioNoteJob[],
  );
  const removePendingAudioNoteJob = vi.fn(async () => {});
  const postAudioToNoteStream = vi.fn(async () => studyResult);
  const applyAudioNoteStudyResult = vi.fn(async () => {});
  const uploadStudyRecordingAttachment = vi.fn(async () => ({
    id: 'att-1',
    filename: 'recording.webm',
  }));
  const formatStudyRecordingUploadWarning = vi.fn(
    () => 'formatted-upload-warning',
  );
  const onlineListeners: Array<() => void> = [];
  const subscribeOnline = vi.fn((listener: () => void) => {
    onlineListeners.push(listener);
    return () => {
      const i = onlineListeners.lastIndexOf(listener);
      if (i >= 0) {
        onlineListeners.splice(i, 1);
      }
    };
  });
  return {
    useRootLoaderData,
    useNotesDataMeta,
    useNotesDataActions,
    patchNoteInList,
    refreshNotesList,
    isLikelyOnline,
    listPendingAudioNoteJobs,
    removePendingAudioNoteJob,
    postAudioToNoteStream,
    applyAudioNoteStudyResult,
    uploadStudyRecordingAttachment,
    formatStudyRecordingUploadWarning,
    subscribeOnline,
    onlineListeners,
  };
});

vi.mock('@nota/note-runtime/session-context', () => ({
  useRootLoaderData: () => drainMocks.useRootLoaderData(),
}));

vi.mock('@nota/note-runtime/notes-data-context', () => ({
  useNotesDataMeta: () => drainMocks.useNotesDataMeta(),
  useNotesDataActions: () => drainMocks.useNotesDataActions(),
}));

vi.mock('@nota/data-source/notes-offline-sync', () => ({
  isLikelyOnline: () => drainMocks.isLikelyOnline(),
}));

vi.mock('./audio-note-pending-idb', () => ({
  listPendingAudioNoteJobs: (userId: string) =>
    drainMocks.listPendingAudioNoteJobs(userId),
  removePendingAudioNoteJob: (id: string) =>
    drainMocks.removePendingAudioNoteJob(id),
}));

vi.mock('./audio-to-note-client', () => ({
  postAudioToNoteStream: (blob: Blob) => drainMocks.postAudioToNoteStream(blob),
}));

vi.mock('./audio-to-note-apply', () => ({
  applyAudioNoteStudyResult: (opts: unknown) =>
    drainMocks.applyAudioNoteStudyResult(opts),
}));

vi.mock('@nota/data-source/pdf-attachment-client', () => ({
  uploadStudyRecordingAttachment: (
    noteId: string,
    userId: string,
    blob: Blob,
    mime: string,
  ) => drainMocks.uploadStudyRecordingAttachment(noteId, userId, blob, mime),
}));

vi.mock('./study-recording-upload-warning', () => ({
  formatStudyRecordingUploadWarning: (err: unknown) =>
    drainMocks.formatStudyRecordingUploadWarning(err),
}));

vi.mock('@nota/data-source/browser-connectivity', () => ({
  subscribeOnline: (listener: () => void) =>
    drainMocks.subscribeOnline(listener),
}));

function Harness({ enabled = true }: { enabled?: boolean }): null {
  useAudioNotePendingDrain(enabled);
  return null;
}

async function flushAsyncEffects(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useAudioNotePendingDrain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    drainMocks.onlineListeners.length = 0;
    useAudioToNoteSession.getState().reset();
    drainMocks.useRootLoaderData.mockReturnValue({
      user: { id: 'user-1', email: null },
    });
    drainMocks.useNotesDataMeta.mockReturnValue({
      notaProEntitled: true,
      loading: false,
      userPreferences: null,
      loadError: undefined,
    });
    drainMocks.isLikelyOnline.mockReturnValue(true);
    drainMocks.listPendingAudioNoteJobs.mockResolvedValue([]);
  });

  it('does not list pending jobs when the hook is disabled', async () => {
    // Arrange
    render(<Harness enabled={false} />);

    // Act
    await flushAsyncEffects();

    // Assert
    expect(drainMocks.listPendingAudioNoteJobs).not.toHaveBeenCalled();
    expect(drainMocks.subscribeOnline).not.toHaveBeenCalled();
  });

  it('does not list pending jobs when the user is not Nota Pro entitled', async () => {
    // Arrange
    drainMocks.useNotesDataMeta.mockReturnValue({
      notaProEntitled: false,
      loading: false,
      userPreferences: null,
      loadError: undefined,
    });
    render(<Harness />);

    // Act
    await flushAsyncEffects();

    // Assert
    expect(drainMocks.listPendingAudioNoteJobs).not.toHaveBeenCalled();
  });

  it('does not list pending jobs when there is no signed-in user id', async () => {
    // Arrange
    drainMocks.useRootLoaderData.mockReturnValue({ user: null });
    render(<Harness />);

    // Act
    await flushAsyncEffects();

    // Assert
    expect(drainMocks.listPendingAudioNoteJobs).not.toHaveBeenCalled();
  });

  it('does not list pending jobs while notes entitlement meta is still loading', async () => {
    // Arrange
    drainMocks.useNotesDataMeta.mockReturnValue({
      notaProEntitled: true,
      loading: true,
      userPreferences: null,
      loadError: undefined,
    });
    render(<Harness />);

    // Act
    await flushAsyncEffects();

    // Assert
    expect(drainMocks.listPendingAudioNoteJobs).not.toHaveBeenCalled();
  });

  it('returns early inside drain when the device appears offline', async () => {
    // Arrange
    drainMocks.isLikelyOnline.mockReturnValue(false);
    render(<Harness />);

    // Act
    await flushAsyncEffects();

    // Assert
    expect(drainMocks.listPendingAudioNoteJobs).not.toHaveBeenCalled();
    expect(drainMocks.subscribeOnline).toHaveBeenCalledTimes(1);
  });

  it('subscribes to browser online events when draining is active', async () => {
    // Arrange
    render(<Harness />);

    // Act
    await flushAsyncEffects();

    // Assert
    expect(drainMocks.subscribeOnline).toHaveBeenCalledTimes(1);
    expect(typeof drainMocks.subscribeOnline.mock.calls[0]?.[0]).toBe(
      'function',
    );
  });

  it('lists pending jobs for the current user and completes the happy path', async () => {
    // Arrange
    const audio = new Uint8Array([1, 2, 3, 4]).buffer;
    const job: PendingAudioNoteJob = {
      id: 'job-1',
      noteId: 'note-1',
      userId: 'user-1',
      audio,
      mime: 'audio/webm',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    drainMocks.listPendingAudioNoteJobs.mockResolvedValue([job]);
    render(<Harness />);

    // Act
    await waitFor(() => {
      expect(drainMocks.removePendingAudioNoteJob).toHaveBeenCalledWith(
        'job-1',
      );
    });

    // Assert
    expect(drainMocks.listPendingAudioNoteJobs).toHaveBeenCalledWith('user-1');
    expect(drainMocks.postAudioToNoteStream).toHaveBeenCalledTimes(1);
    const blobArg = drainMocks.postAudioToNoteStream.mock.calls[0]?.[0] as
      | Blob
      | undefined;
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg?.type).toBe('audio/webm');
    expect(drainMocks.uploadStudyRecordingAttachment).toHaveBeenCalledWith(
      'note-1',
      'user-1',
      expect.any(Blob),
      'audio/webm',
    );
    expect(drainMocks.applyAudioNoteStudyResult).toHaveBeenCalledWith(
      expect.objectContaining({
        noteId: 'note-1',
        userId: 'user-1',
        result: studyResult,
        recording: { attachmentId: 'att-1', filename: 'recording.webm' },
        patchNoteInList: drainMocks.patchNoteInList,
        refreshNotesList: drainMocks.refreshNotesList,
        mode: 'replace',
      }),
    );
    expect(useAudioToNoteSession.getState().recordingAttachmentWarning).toBe(
      null,
    );
  });

  it('passes append mode through when the pending job requests append', async () => {
    // Arrange
    const job: PendingAudioNoteJob = {
      id: 'job-append',
      noteId: 'note-2',
      userId: 'user-1',
      audio: new ArrayBuffer(0),
      mime: 'audio/webm',
      createdAt: '2026-01-01T00:00:00.000Z',
      append: true,
    };
    drainMocks.listPendingAudioNoteJobs.mockResolvedValue([job]);
    render(<Harness />);

    // Act
    await waitFor(() => {
      expect(drainMocks.applyAudioNoteStudyResult).toHaveBeenCalled();
    });

    // Assert
    expect(drainMocks.applyAudioNoteStudyResult).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'append' }),
    );
  });

  it('sets recording attachment warning when upload fails but study notes still apply', async () => {
    // Arrange
    const uploadErr = new Error('network');
    drainMocks.uploadStudyRecordingAttachment.mockRejectedValueOnce(uploadErr);
    const job: PendingAudioNoteJob = {
      id: 'job-warn',
      noteId: 'note-3',
      userId: 'user-1',
      audio: new ArrayBuffer(0),
      mime: 'audio/webm',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    drainMocks.listPendingAudioNoteJobs.mockResolvedValue([job]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Harness />);

    // Act
    await waitFor(() => {
      expect(useAudioToNoteSession.getState().recordingAttachmentWarning).toBe(
        'formatted-upload-warning',
      );
    });

    // Assert
    expect(drainMocks.formatStudyRecordingUploadWarning).toHaveBeenCalledWith(
      uploadErr,
    );
    expect(warnSpy).toHaveBeenCalled();
    expect(drainMocks.applyAudioNoteStudyResult).toHaveBeenCalledWith(
      expect.objectContaining({
        recording: undefined,
      }),
    );
    expect(drainMocks.removePendingAudioNoteJob).toHaveBeenCalledWith(
      'job-warn',
    );
    warnSpy.mockRestore();
  });

  it('logs and skips remove when streaming study notes fails', async () => {
    // Arrange
    const streamErr = new Error('stt failed');
    drainMocks.postAudioToNoteStream.mockRejectedValueOnce(streamErr);
    const job: PendingAudioNoteJob = {
      id: 'job-bad',
      noteId: 'note-4',
      userId: 'user-1',
      audio: new ArrayBuffer(0),
      mime: 'audio/webm',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    drainMocks.listPendingAudioNoteJobs.mockResolvedValue([job]);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Harness />);

    // Act
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    // Assert
    expect(drainMocks.removePendingAudioNoteJob).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('runs drain again when the online subscription callback fires', async () => {
    // Arrange
    render(<Harness />);
    await waitFor(() => {
      expect(drainMocks.listPendingAudioNoteJobs).toHaveBeenCalled();
    });
    drainMocks.listPendingAudioNoteJobs.mockClear();
    const listener = drainMocks.onlineListeners[0];
    expect(listener).toBeTypeOf('function');

    // Act
    await act(async () => {
      if (listener) {
        listener();
      }
      await Promise.resolve();
    });

    // Assert
    expect(drainMocks.listPendingAudioNoteJobs).toHaveBeenCalledTimes(1);
  });
});
