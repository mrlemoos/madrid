/**
 * ProseMirror document JSON — the note body shape stored in `notes.content`
 * jsonb and understood by TipTap. Kept as `unknown`-ish structural JSON so this
 * package never depends on the editor's concrete schema.
 */
export type ProseMirrorJSON = Record<string, unknown>;

/**
 * The Yjs XML-fragment field that holds the note body. MUST match the `field`
 * option passed to TipTap's Collaboration extension in the editor adapter, or
 * the editor binds to an empty fragment. Yjs' own default is `'prosemirror'`;
 * TipTap's is `'default'` — we pin `'default'` and pass it explicitly on both
 * sides so the two never drift.
 */
export const NOTA_YDOC_FIELD = 'default';

/** A single binary Yjs update (one edit or a folded snapshot). */
export type YjsUpdate = Uint8Array;
