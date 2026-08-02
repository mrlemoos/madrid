import type { PatchNoteMutationResult } from '@nota/notes-offline-core';
import { mergeUpdatedNoteLocalContent } from './note-updated-content-merge.js';
import type { Json, Note } from '@nota/database-types';

/** Map a vault patch result to the list row the editor should show. */
export function noteAfterPatchMutation(
  result: PatchNoteMutationResult,
  localNote: Note,
  localPatch: Partial<Note>,
  pendingContent: unknown,
  fallbackContent: Json,
): Note {
  if (result.outcome === 'patched-remote') {
    return mergeUpdatedNoteLocalContent(
      result.note,
      pendingContent,
      fallbackContent,
    );
  }
  return mergeUpdatedNoteLocalContent(
    {
      ...localNote,
      ...localPatch,
      updated_at: new Date().toISOString(),
    },
    pendingContent,
    fallbackContent,
  );
}
