import { describe, expect, it } from 'vitest';
import type { Note } from '@nota/database-types';
import { notesToIdMap } from './notes-id-map';

const NOTE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NOTE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function minimalNote(overrides: Partial<Note> & Pick<Note, 'id'>): Note {
  return {
    user_id: 'u',
    title: '',
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
    due_at: null,
    is_deadline: false,
    editor_settings: {},
    banner_attachment_id: null,
    folder_id: null,
    ...overrides,
  };
}

describe('notesToIdMap', () => {
  it('returns an empty map when given no notes', () => {
    // Arrange
    const notes: readonly Note[] = [];

    // Act
    const map = notesToIdMap(notes);

    // Assert
    expect(map.size).toBe(0);
  });

  it('maps each note id to its note for a single note', () => {
    // Arrange
    const note = minimalNote({ id: NOTE_A, title: 'Alpha' });

    // Act
    const map = notesToIdMap([note]);

    // Assert
    expect(map.size).toBe(1);
    expect(map.get(NOTE_A)).toBe(note);
  });

  it('maps multiple distinct ids to their notes', () => {
    // Arrange
    const a = minimalNote({ id: NOTE_A, title: 'First' });
    const b = minimalNote({ id: NOTE_B, title: 'Second' });

    // Act
    const map = notesToIdMap([a, b]);

    // Assert
    expect(map.size).toBe(2);
    expect(map.get(NOTE_A)).toBe(a);
    expect(map.get(NOTE_B)).toBe(b);
  });

  it('when duplicate ids appear, the last occurrence wins', () => {
    // Arrange
    const first = minimalNote({ id: NOTE_A, title: 'First' });
    const second = minimalNote({ id: NOTE_A, title: 'Second' });

    // Act
    const map = notesToIdMap([first, second]);

    // Assert
    expect(map.size).toBe(1);
    expect(map.get(NOTE_A)).toBe(second);
  });
});
