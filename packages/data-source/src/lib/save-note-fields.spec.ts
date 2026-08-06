import { describe, expect, it, vi } from 'vitest';
import type {
  PatchNoteMutationInput,
  PatchNoteMutationResult,
} from '@nota/notes-offline-core';
import {
  createNoteFieldSaver,
  type NoteFieldSaverDeps,
} from './save-note-fields';
import type { Note } from '@nota/database-types';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    user_id: 'user-1',
    title: 'Old title',
    content: { type: 'doc', content: [] },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    due_at: null,
    is_deadline: false,
    editor_settings: {},
    banner_attachment_id: null,
    folder_id: null,
    share_token: null,
    ...overrides,
  };
}

function makeDeps(overrides: Partial<NoteFieldSaverDeps> = {}): {
  deps: NoteFieldSaverDeps;
  patchNote: ReturnType<typeof vi.fn>;
  setSaveStatus: ReturnType<typeof vi.fn>;
  onNoteUpdated: ReturnType<typeof vi.fn>;
} {
  const patchNote = vi.fn(
    async (
      _userId: string,
      _input: PatchNoteMutationInput,
    ): Promise<PatchNoteMutationResult> => ({ outcome: 'patched-local' }),
  );
  const setSaveStatus = vi.fn();
  const onNoteUpdated = vi.fn();
  const deps: NoteFieldSaverDeps = {
    patchNote,
    getNote: () => makeNote(),
    getUserId: () => 'user-1',
    getTitle: () => 'Fresh title',
    getPendingContent: () => undefined,
    getEntitled: () => true,
    getOnNoteUpdated: () => onNoteUpdated,
    setSaveStatus,
    ...overrides,
  };
  return { deps, patchNote, setSaveStatus, onNoteUpdated };
}

describe('createNoteFieldSaver', () => {
  it('runs the full save ceremony and returns the merged note on success', async () => {
    // Arrange
    const { deps, patchNote, setSaveStatus, onNoteUpdated } = makeDeps();
    const save = createNoteFieldSaver(deps);

    // Act
    const result = await save({
      fields: { title: 'Fresh title' },
      draftContent: { type: 'doc', content: [] },
      fallbackContent: { type: 'doc', content: [] },
      errorMessage: 'Failed to save title:',
    });

    // Assert
    expect(setSaveStatus).toHaveBeenNthCalledWith(1, 'saving');
    expect(setSaveStatus).toHaveBeenLastCalledWith('saved');
    expect(patchNote).toHaveBeenCalledWith('user-1', {
      noteId: 'note-1',
      fields: { title: 'Fresh title' },
      draftContext: expect.objectContaining({ title: 'Fresh title' }),
      allowRemote: true,
    });
    expect(onNoteUpdated).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      note: expect.objectContaining({ id: 'note-1' }),
    });
  });

  it('skips the remote write when the user is not entitled', async () => {
    // Arrange
    const { deps, patchNote } = makeDeps({ getEntitled: () => false });
    const save = createNoteFieldSaver(deps);

    // Act
    await save({
      fields: { content: { type: 'doc', content: [] } },
      draftContent: { type: 'doc', content: [] },
      fallbackContent: { type: 'doc', content: [] },
      errorMessage: 'Failed to save note:',
    });

    // Assert
    expect(patchNote).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ allowRemote: false }),
    );
  });

  it('reports failure without throwing and sets an error status', async () => {
    // Arrange
    const boom = new Error('offline');
    const { deps, setSaveStatus, onNoteUpdated } = makeDeps({
      patchNote: vi.fn(async () => {
        throw boom;
      }),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const save = createNoteFieldSaver(deps);

    // Act
    const result = await save({
      fields: { title: 'x' },
      draftContent: {},
      fallbackContent: {},
      errorMessage: 'Failed to save title:',
    });

    // Assert
    expect(result).toEqual({ ok: false, error: boom });
    expect(setSaveStatus).toHaveBeenLastCalledWith('error');
    expect(onNoteUpdated).not.toHaveBeenCalled();
  });

  it('short-circuits when there is no signed-in user', async () => {
    // Arrange
    const { deps, patchNote, setSaveStatus } = makeDeps({
      getUserId: () => undefined,
    });
    const save = createNoteFieldSaver(deps);

    // Act
    const result = await save({
      fields: { title: 'x' },
      draftContent: {},
      fallbackContent: {},
      errorMessage: 'Failed to save title:',
    });

    // Assert
    expect(result.ok).toBe(false);
    expect(patchNote).not.toHaveBeenCalled();
    expect(setSaveStatus).not.toHaveBeenCalled();
  });
});
