import { describe, expect, it } from 'vitest';
import { noteHashHref } from './note-hash-href';

describe('noteHashHref', () => {
  it('builds a notes/note hash for the given note id', () => {
    // Arrange
    const noteId = '11111111-1111-4111-8111-111111111111';

    // Act
    const href = noteHashHref(noteId);

    // Assert
    expect(href).toBe(`#/notes/note/${noteId}`);
  });

  it('falls back to the notes list hash when the note id is empty', () => {
    // Arrange
    const noteId = '';

    // Act
    const href = noteHashHref(noteId);

    // Assert
    expect(href).toBe('#/notes');
  });
});
