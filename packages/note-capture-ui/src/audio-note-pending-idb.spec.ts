import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fakeIndexedDB,
  resetFakeIndexedDb,
} from '@getmadrid/testing-fakes/indexed-db';
import {
  enqueuePendingAudioNoteJob,
  listPendingAudioNoteJobs,
  removePendingAudioNoteJob,
} from './audio-note-pending-idb';

const job = {
  noteId: 'note-1',
  userId: 'user-1',
  audio: new ArrayBuffer(8),
  mime: 'audio/wav',
};

beforeEach(() => {
  resetFakeIndexedDb();
  vi.stubGlobal('indexedDB', fakeIndexedDB);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('enqueuePendingAudioNoteJob', () => {
  it('stores the recording with a generated id and timestamp', async () => {
    // Arrange|Act
    const id = await enqueuePendingAudioNoteJob(job);

    // Assert
    const [stored] = await listPendingAudioNoteJobs('user-1');
    expect(stored?.id).toBe(id);
    expect(stored?.noteId).toBe('note-1');
    expect(Number.isNaN(Date.parse(stored?.createdAt ?? ''))).toBe(false);
  });

  it('remembers that the job should append rather than replace', async () => {
    // Arrange|Act
    await enqueuePendingAudioNoteJob({ ...job, append: true });

    // Assert
    const [stored] = await listPendingAudioNoteJobs('user-1');
    expect(stored?.append).toBe(true);
  });

  it('fails loudly where IndexedDB is unavailable, so the recording is not lost silently', async () => {
    // Arrange
    vi.stubGlobal('indexedDB', undefined);

    // Act|Assert
    await expect(enqueuePendingAudioNoteJob(job)).rejects.toThrow(
      'IndexedDB is not available',
    );
  });
});

describe('listPendingAudioNoteJobs', () => {
  it('returns only the signed-in user’s jobs', async () => {
    // Arrange
    await enqueuePendingAudioNoteJob(job);
    await enqueuePendingAudioNoteJob({ ...job, userId: 'user-2' });

    // Act
    const jobs = await listPendingAudioNoteJobs('user-1');

    // Assert — the database is shared across accounts on one device
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.userId).toBe('user-1');
  });

  it('is empty before anything is captured offline', async () => {
    // Arrange|Act|Assert
    await expect(listPendingAudioNoteJobs('user-1')).resolves.toEqual([]);
  });

  it('is empty rather than throwing where IndexedDB is unavailable', async () => {
    // Arrange
    vi.stubGlobal('indexedDB', undefined);

    // Act|Assert
    await expect(listPendingAudioNoteJobs('user-1')).resolves.toEqual([]);
  });
});

describe('removePendingAudioNoteJob', () => {
  it('drops a job once it has been drained', async () => {
    // Arrange
    const id = await enqueuePendingAudioNoteJob(job);

    // Act
    await removePendingAudioNoteJob(id);

    // Assert
    await expect(listPendingAudioNoteJobs('user-1')).resolves.toEqual([]);
  });

  it('does nothing where IndexedDB is unavailable', async () => {
    // Arrange
    vi.stubGlobal('indexedDB', undefined);

    // Act|Assert
    await expect(removePendingAudioNoteJob('any')).resolves.toBeUndefined();
  });
});
