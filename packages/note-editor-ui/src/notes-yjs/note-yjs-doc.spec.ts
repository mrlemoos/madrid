import { describe, expect, it, vi } from 'vitest';

const IndexeddbPersistence = vi.fn(function (
  this: Record<string, unknown>,
  name: string,
  doc: unknown,
) {
  this.name = name;
  this.doc = doc;
});

vi.mock('y-indexeddb', () => ({ IndexeddbPersistence }));

const { createNoteYjsDoc, noteYjsDocKey } = await import('./note-yjs-doc');

describe('noteYjsDocKey', () => {
  it('namespaces the database per note', () => {
    // Arrange|Act|Assert — changing this shape orphans every stored doc
    expect(noteYjsDocKey('note-1')).toBe('nota-note-yjs-note-1');
    expect(noteYjsDocKey('note-2')).not.toBe(noteYjsDocKey('note-1'));
  });
});

describe('createNoteYjsDoc', () => {
  it('backs a fresh doc with persistence under the note’s key', () => {
    // Arrange|Act
    const { doc, persistence } = createNoteYjsDoc('note-1');

    // Assert
    expect(doc.clientID).toBeTypeOf('number');
    expect(IndexeddbPersistence).toHaveBeenCalledWith(
      'nota-note-yjs-note-1',
      doc,
    );
    expect(persistence).toBeDefined();
  });

  it('gives each note its own doc', () => {
    // Arrange|Act
    const first = createNoteYjsDoc('note-1');
    const second = createNoteYjsDoc('note-2');

    // Assert
    expect(second.doc).not.toBe(first.doc);
  });
});
