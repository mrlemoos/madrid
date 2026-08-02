import { describe, expect, it } from 'vitest';
import type { Json, Note } from '@nota/database-types';
import { editorDraftContext } from './note-editor-draft-context.js';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    user_id: 'user-1',
    title: 'Local title',
    content: { type: 'doc' },
    created_at: '2020-01-01T00:00:00.000Z',
    updated_at: '2020-01-01T00:00:00.000Z',
    due_at: null,
    is_deadline: false,
    editor_settings: { showInNoteGraph: true },
    banner_attachment_id: null,
    folder_id: 'folder-1',
    ...overrides,
  } as Note;
}

describe('editorDraftContext', () => {
  it('copies identity and schedule fields from the note', () => {
    // Arrange
    const note = makeNote({
      due_at: '2024-06-01T12:00:00.000Z',
      is_deadline: true,
    });

    // Act
    const draft = editorDraftContext(note);

    // Assert
    expect(draft.user_id).toBe('user-1');
    expect(draft.created_at).toBe('2020-01-01T00:00:00.000Z');
    expect(draft.due_at).toBe('2024-06-01T12:00:00.000Z');
    expect(draft.is_deadline).toBe(true);
    expect(draft.folder_id).toBe('folder-1');
    expect(draft.editor_settings).toEqual({ showInNoteGraph: true });
  });

  it('applies title, content, editor_settings, and banner overrides', () => {
    // Arrange
    const note = makeNote();
    const content = { type: 'doc', content: [] } as Json;
    const editorSettings = { showInNoteGraph: false } as Json;

    // Act
    const draft = editorDraftContext(note, {
      title: 'Draft title',
      content,
      editor_settings: editorSettings,
      banner_attachment_id: 'banner-1',
    });

    // Assert
    expect(draft.title).toBe('Draft title');
    expect(draft.content).toEqual(content);
    expect(draft.editor_settings).toEqual(editorSettings);
    expect(draft.banner_attachment_id).toBe('banner-1');
  });

  it('omits title and content when no overrides are provided', () => {
    // Arrange
    const note = makeNote();

    // Act
    const draft = editorDraftContext(note);

    // Assert
    expect(draft.title).toBeUndefined();
    expect(draft.content).toBeUndefined();
    expect(draft.banner_attachment_id).toBeUndefined();
  });
});
