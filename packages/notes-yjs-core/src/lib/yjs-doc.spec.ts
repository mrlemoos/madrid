import { Schema } from 'prosemirror-model';
import * as Y from 'yjs';

import { NOTA_YDOC_FIELD, type ProseMirrorJSON } from './types.js';
import {
  encodeDocAsSnapshot,
  foldUpdatesToDoc,
  seedYDocFromContent,
  yDocToContent,
} from './yjs-doc.js';

// A minimal ProseMirror schema (doc > paragraph > text) — enough to exercise
// the conversion invariants without pulling the editor's full extension set.
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
  },
  marks: {},
});

function paragraph(text: string): ProseMirrorJSON {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function docOf(...paras: ProseMirrorJSON[]): ProseMirrorJSON {
  return { type: 'doc', content: paras };
}

describe('seedYDocFromContent + fold + yDocToContent', () => {
  it('round-trips ProseMirror JSON through a seeded Yjs update', () => {
    // Arrange
    const content = docOf(paragraph('hello world'), paragraph('second line'));

    // Act
    const seed = seedYDocFromContent(schema, content);
    const doc = foldUpdatesToDoc([seed]);
    const roundTripped = yDocToContent(schema, doc);

    // Assert
    expect(roundTripped).toEqual(content);
  });

  it('folds updates commutatively — order does not change final content', () => {
    // Arrange: seed a base, then two concurrent edits branched from it.
    const base = docOf(paragraph('base'));
    const seed = seedYDocFromContent(schema, base);

    const docA = foldUpdatesToDoc([seed]);
    const docB = foldUpdatesToDoc([seed]);
    // Edit each branch at a distinct XML fragment position.
    appendParagraph(docA.getXmlFragment(NOTA_YDOC_FIELD), 'from-a');
    appendParagraph(docB.getXmlFragment(NOTA_YDOC_FIELD), 'from-b');
    const updateA = Y.encodeStateAsUpdate(docA);
    const updateB = Y.encodeStateAsUpdate(docB);

    // Act
    const forward = yDocToContent(
      schema,
      foldUpdatesToDoc([seed, updateA, updateB]),
    );
    const reverse = yDocToContent(
      schema,
      foldUpdatesToDoc([seed, updateB, updateA]),
    );

    // Assert
    expect(forward).toEqual(reverse);
  });

  it('snapshot of a folded doc reproduces the same content as the full log', () => {
    // Arrange
    const content = docOf(
      paragraph('one'),
      paragraph('two'),
      paragraph('three'),
    );
    const seed = seedYDocFromContent(schema, content);
    const folded = foldUpdatesToDoc([seed]);

    // Act
    const snapshot = encodeDocAsSnapshot(folded);
    const fromSnapshot = yDocToContent(schema, foldUpdatesToDoc([snapshot]));

    // Assert
    expect(fromSnapshot).toEqual(content);
  });
});

// Simulate a remote edit: attach a paragraph element to the fragment first,
// then fill it — writing into a still-detached node makes Yjs warn.
function appendParagraph(fragment: Y.XmlFragment, text: string): void {
  const el = new Y.XmlElement('paragraph');
  fragment.push([el]);
  el.push([new Y.XmlText(text)]);
}
