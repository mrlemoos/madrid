import { describe, expect, it } from 'vitest';
import type { Json, Note } from '@nota/database-types';
import { noteAfterPatchMutation } from './note-patch-result';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'note-1',
    title: 'Local title',
    content: { type: 'doc' },
    updated_at: '2020-01-01T00:00:00.000Z',
    ...overrides,
  } as Note;
}

describe('noteAfterPatchMutation', () => {
  it('uses the server note for a patched-remote outcome, keeping the pending body', () => {
    // Arrange
    const localNote = makeNote({ title: 'Local title' });
    const serverNote = makeNote({
      title: 'Server title',
      updated_at: '2021-06-06T00:00:00.000Z',
    });
    const pendingContent = { type: 'doc', pending: true } as Json;
    const fallbackContent = { type: 'doc', fallback: true } as Json;

    // Act
    const result = noteAfterPatchMutation(
      { outcome: 'patched-remote', note: serverNote },
      localNote,
      { title: 'ignored patch' },
      pendingContent,
      fallbackContent,
    );

    // Assert
    expect(result.title).toBe('Server title');
    expect(result.updated_at).toBe('2021-06-06T00:00:00.000Z');
    expect(result.content).toEqual(pendingContent);
  });

  it('falls back to fallbackContent when there is no pending body', () => {
    // Arrange
    const serverNote = makeNote({ title: 'Server title' });
    const fallbackContent = { type: 'doc', fallback: true } as Json;

    // Act
    const result = noteAfterPatchMutation(
      { outcome: 'patched-remote', note: serverNote },
      makeNote(),
      {},
      null,
      fallbackContent,
    );

    // Assert
    expect(result.content).toEqual(fallbackContent);
  });

  it('merges local note with the local patch and stamps a fresh updated_at for a local outcome', () => {
    // Arrange
    const before = Date.now();
    const localNote = makeNote({
      title: 'Local title',
      updated_at: '2020-01-01T00:00:00.000Z',
    });
    const pendingContent = { type: 'doc', pending: true } as Json;
    const fallbackContent = { type: 'doc', fallback: true } as Json;

    // Act
    const result = noteAfterPatchMutation(
      { outcome: 'patched-local' },
      localNote,
      { title: 'Patched title' },
      pendingContent,
      fallbackContent,
    );

    // Assert
    expect(result.title).toBe('Patched title');
    expect(result.content).toEqual(pendingContent);
    expect(new Date(result.updated_at).getTime()).toBeGreaterThanOrEqual(
      before,
    );
  });
});
