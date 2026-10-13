import { foldUpdatesToDoc, NOTA_YDOC_FIELD } from '@getmadrid/notes-yjs-core';
import * as Y from 'yjs';

import type { NoteJsonMark, NoteJsonNode } from './note-markdown.server';

// Server-side append into a note's Yjs body without the editor schema: build Y
// types exactly the way y-prosemirror encodes ProseMirror nodes (element per
// node, non-null attrs, runs of text folded into one XmlText whose formatting
// attributes are the marks), then insert at the end of the fragment. Existing
// custom nodes (PDFs, recordings, link previews) are never read or rewritten.

function marksToAttributes(
  marks: NoteJsonMark[] | undefined,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const mark of marks ?? []) {
    attrs[mark.type] = mark.attrs ?? {};
  }
  return attrs;
}

function toYType(node: NoteJsonNode): Y.XmlElement {
  const el = new Y.XmlElement(node.type);
  for (const [key, value] of Object.entries(node.attrs ?? {})) {
    if (value !== null && value !== undefined) {
      el.setAttribute(key, value as string);
    }
  }
  const children: Array<Y.XmlElement | Y.XmlText> = [];
  let run: NoteJsonNode[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const text = new Y.XmlText();
    text.applyDelta(
      run.map((t) => ({
        insert: t.text ?? '',
        attributes: marksToAttributes(t.marks),
      })),
    );
    children.push(text);
    run = [];
  };
  for (const child of node.content ?? []) {
    if (child.type === 'text') {
      run.push(child);
    } else {
      flush();
      children.push(toYType(child));
    }
  }
  flush();
  el.insert(0, children);
  return el;
}

/**
 * Fold the stored update log, append `blocks` at the end of the body, and
 * return only the new delta (what to insert as one `note_yjs_updates` row).
 */
export function appendBlocksToYjsLog(
  updates: readonly Uint8Array[],
  blocks: readonly NoteJsonNode[],
): Uint8Array {
  const doc = foldUpdatesToDoc(updates);
  try {
    const before = Y.encodeStateVector(doc);
    const fragment = doc.getXmlFragment(NOTA_YDOC_FIELD);
    doc.transact(() => {
      fragment.insert(fragment.length, blocks.map(toYType));
    });
    return Y.encodeStateAsUpdate(doc, before);
  } finally {
    doc.destroy();
  }
}
