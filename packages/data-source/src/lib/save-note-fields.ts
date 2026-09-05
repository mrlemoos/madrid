import type {
  NotePatchFields,
  PatchNoteMutationInput,
  PatchNoteMutationResult,
} from '@getmadrid/notes-offline-core';
import { editorDraftContext } from './note-editor-draft-context';
import { noteAfterPatchMutation } from './note-patch-result';
import { persistedDisplayTitle } from './note-title';
import type { Json, Note } from '@getmadrid/database-types';

type DraftOverrides = Parameters<typeof editorDraftContext>[1];

/**
 * Everything the note editor's four save paths (title, body, layout, banner)
 * share, injected as getters so the saver reads live refs without owning them.
 */
export type NoteFieldSaverDeps = {
  patchNote: (
    userId: string,
    input: PatchNoteMutationInput,
  ) => Promise<PatchNoteMutationResult>;
  getNote: () => Note;
  getUserId: () => string | undefined;
  getTitle: () => string;
  getPendingContent: () => unknown;
  getEntitled: () => boolean;
  getOnNoteUpdated: () => ((note: Note) => void) | undefined;
  setSaveStatus: (status: 'saving' | 'saved' | 'error') => void;
};

/** What varies across the four save paths. */
export type SaveNoteFieldsInput = {
  /** The DB patch (only the changed column). */
  fields: NotePatchFields;
  /** Content used for the draft context when persisting a local draft. */
  draftContent: Json;
  /** Content merged back onto the row for `onNoteUpdated`. */
  fallbackContent: Json;
  /** Logged on failure. */
  errorMessage: string;
};

export type SaveNoteFieldsResult =
  | { ok: true; note: Note }
  | { ok: false; error: unknown };

/**
 * Runs the shared save ceremony — status flip, vault patch, list-row merge, and
 * `onNoteUpdated` — for one changed field. Skips the remote write when the
 * signed-in user is not Madrid Pro entitled. Returns `{ ok: false }` (already
 * logged, status set to `error`) instead of throwing, so callers can gate their
 * own bookkeeping (`lastSavedTitle`, `lastSavedContent`) on success.
 */
export function createNoteFieldSaver(
  deps: NoteFieldSaverDeps,
): (input: SaveNoteFieldsInput) => Promise<SaveNoteFieldsResult> {
  return async function saveNoteFields({
    fields,
    draftContent,
    fallbackContent,
    errorMessage,
  }) {
    const userId = deps.getUserId();
    if (!userId) {
      return { ok: false, error: new Error('Not authenticated') };
    }

    const note = deps.getNote();
    const title = persistedDisplayTitle(deps.getTitle());
    const overrides: DraftOverrides = {
      title,
      content: draftContent,
      editor_settings: fields.editor_settings,
      banner_attachment_id: fields.banner_attachment_id,
    };

    deps.setSaveStatus('saving');
    try {
      const result = await deps.patchNote(userId, {
        noteId: note.id,
        fields,
        draftContext: editorDraftContext(note, overrides),
        allowRemote: deps.getEntitled(),
      });
      const patched = noteAfterPatchMutation(
        result,
        note,
        { title, ...(fields as Partial<Note>) },
        deps.getPendingContent(),
        fallbackContent,
      );
      deps.getOnNoteUpdated()?.(patched);
      deps.setSaveStatus('saved');
      return { ok: true, note: patched };
    } catch (error) {
      console.error(errorMessage, error);
      deps.setSaveStatus('error');
      return { ok: false, error };
    }
  };
}
