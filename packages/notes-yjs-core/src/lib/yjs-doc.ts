import type { Schema } from 'prosemirror-model';
import {
  prosemirrorJSONToYDoc,
  yXmlFragmentToProseMirrorRootNode,
} from 'y-prosemirror';
import * as Y from 'yjs';

import { NOTA_YDOC_FIELD, type ProseMirrorJSON, type YjsUpdate } from './types';

/**
 * Build the first Yjs update for a note from its existing `content` jsonb.
 *
 * Lazy seeding: when a note has no `note_yjs_updates` rows yet, the client turns
 * its ProseMirror JSON into a Yjs doc and writes this update as `seq` 0. The
 * `schema` is injected by the caller (built from the TipTap extensions) so this
 * package stays free of any editor dependency and remains portable to native.
 */
export function seedYDocFromContent(
  schema: Schema,
  content: ProseMirrorJSON,
): YjsUpdate {
  const doc = prosemirrorJSONToYDoc(schema, content, NOTA_YDOC_FIELD);
  const update = Y.encodeStateAsUpdate(doc);
  doc.destroy();
  return update;
}

/**
 * Fold a sequence of binary updates (log rows, oldest first, snapshot included)
 * into a live Yjs doc. Order does not affect the final state — CRDT merge is
 * commutative — but callers should still apply in `seq` order for determinism.
 */
export function foldUpdatesToDoc(updates: readonly YjsUpdate[]): Y.Doc {
  const doc = new Y.Doc();
  for (const update of updates) {
    Y.applyUpdate(doc, update);
  }
  return doc;
}

/**
 * Project a Yjs doc back to ProseMirror JSON — the derived `content` read-model.
 * Needs the same injected `schema` as seeding; the caller (client at save time)
 * always has it.
 */
export function yDocToContent(schema: Schema, doc: Y.Doc): ProseMirrorJSON {
  const fragment = doc.getXmlFragment(NOTA_YDOC_FIELD);
  const json: unknown = yXmlFragmentToProseMirrorRootNode(
    fragment,
    schema,
  ).toJSON();
  return json as ProseMirrorJSON;
}

/**
 * Encode a folded doc as a single update — the snapshot written during
 * compaction to replace the rows it folds.
 */
export function encodeDocAsSnapshot(doc: Y.Doc): YjsUpdate {
  return Y.encodeStateAsUpdate(doc);
}
