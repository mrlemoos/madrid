import { useEffect, useEffectEvent } from 'react';
import { useRootLoaderData } from '@getmadrid/note-runtime/session-context';
import {
  useNotesDataActions,
  useNotesDataMeta,
} from '@getmadrid/note-runtime/notes-data-context';
import { isLikelyOnline } from '@getmadrid/data-source/notes-offline-sync';
import {
  listPendingAudioNoteJobs,
  removePendingAudioNoteJob,
} from './audio-note-pending-idb';
import { postAudioToNoteStream } from './audio-to-note-client';
import { applyAudioNoteStudyResult } from './audio-to-note-apply';
import { uploadStudyRecordingAttachment } from '@getmadrid/data-source/pdf-attachment-client';
import { formatStudyRecordingUploadWarning } from './study-recording-upload-warning';
import { useAudioToNoteSession } from '@getmadrid/note-runtime/stores/audio-session';
import { subscribeOnline } from '@getmadrid/data-source/browser-connectivity';

/**
 * When the device is back online, processes queued audio-to-note jobs from IndexedDB.
 */
export function useAudioNotePendingDrain(enabled: boolean): void {
  const { user } = useRootLoaderData();
  const userId = user?.id;
  const { notaProEntitled, loading } = useNotesDataMeta();
  const { patchNoteInList, refreshNotesList } = useNotesDataActions();

  const drain = useEffectEvent(async (): Promise<void> => {
    if (!isLikelyOnline() || !userId) {
      return;
    }

    const jobs = await listPendingAudioNoteJobs(userId);
    for (const j of jobs) {
      try {
        const blob = new Blob([j.audio], { type: j.mime });
        const result = await postAudioToNoteStream(blob);

        let recording: { attachmentId: string; filename: string } | undefined;
        let recordingUploadFailure: unknown;
        try {
          const att = await uploadStudyRecordingAttachment(
            j.noteId,
            userId,
            blob,
            j.mime,
          );
          recording = { attachmentId: att.id, filename: att.filename };
        } catch (e) {
          recordingUploadFailure = e;
        }
        await applyAudioNoteStudyResult({
          noteId: j.noteId,
          userId,
          result,
          recording,
          patchNoteInList,
          refreshNotesList,
          mode: j.append ? 'append' : 'replace',
        });
        if (recordingUploadFailure !== undefined) {
          const warning = formatStudyRecordingUploadWarning(
            recordingUploadFailure,
          );
          console.warn('[nota] Study recording upload failed', warning);
          useAudioToNoteSession
            .getState()
            .setRecordingAttachmentWarning(warning);
        }
        await removePendingAudioNoteJob(j.id);
      } catch (error) {
        console.error('[nota] Error processing audio-to-note job', error);
      }
    }
  });

  useEffect(() => {
    if (!enabled || !notaProEntitled || !userId || loading) {
      return;
    }
    void drain();
    return subscribeOnline(() => {
      void drain();
    });
  }, [enabled, notaProEntitled, userId, loading, drain]);
}
