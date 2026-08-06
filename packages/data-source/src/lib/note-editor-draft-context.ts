import type { NoteDraftContext } from '@nota/notes-offline-core';
import type { Json, Note } from '@nota/database-types';

export function editorDraftContext(
  note: Note,
  overrides: {
    title?: string;
    content?: Json;
    editor_settings?: Json;
    banner_attachment_id?: string | null;
  } = {},
): NoteDraftContext {
  return {
    user_id: note.user_id,
    created_at: note.created_at,
    due_at: note.due_at,
    is_deadline: note.is_deadline,
    editor_settings: overrides.editor_settings ?? note.editor_settings,
    title: overrides.title,
    content: overrides.content,
    banner_attachment_id: overrides.banner_attachment_id,
    folder_id: note.folder_id,
  };
}
