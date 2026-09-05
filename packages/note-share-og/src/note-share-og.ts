import { extractPlainTextFromDocJson } from '@getmadrid/note-doc-plain-text';

/**
 * The subset of a shared note the link-preview surfaces need. Kept structural
 * (not `SharedNote`) so this package stays free of `@getmadrid/data-source`, which is
 * `platform:web`.
 */
export interface SharedNoteMetaSource {
  title: string;
  content: unknown;
}

/** Framework-neutral fields the share page maps onto Next's `Metadata`. */
export interface SharedNoteMeta {
  title: string;
  /** Absent -- not empty -- when the note has no body text to preview. */
  description?: string;
}

/**
 * Matches `persistedDisplayTitle` in `@getmadrid/data-source`, which this package
 * cannot import across the `platform:shared` boundary.
 */
const UNTITLED_NOTE_TITLE = 'Untitled Note';

/** Where Slack and Google cut a description; truncating earlier keeps it whole. */
const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Shown for an unknown, revoked, or unreadable token. Deliberately identical in
 * both cases: the unfurl must not reveal whether a token ever existed.
 */
export const SHARED_NOTE_UNAVAILABLE_META: SharedNoteMeta = {
  title: 'Madrid',
  description: 'This shared note is not available.',
};

/**
 * `extractPlainTextFromDocJson` concatenates text nodes with no separator, so a
 * whole-doc call glues the last word of one paragraph to the first of the next.
 * Extracting per top-level block and joining with a space keeps the preview
 * readable without changing that shared helper's behaviour elsewhere.
 */
function joinTopLevelBlockText(content: unknown): string {
  const blocks = (content as { content?: unknown } | null)?.content;
  if (!Array.isArray(blocks)) {
    return extractPlainTextFromDocJson(content);
  }
  return blocks
    .map((block) => extractPlainTextFromDocJson(block))
    .filter((text) => text.length > 0)
    .join(' ');
}

/**
 * Body preview for the share unfurl: plain text, whitespace collapsed, cut at a
 * word boundary. Returns `undefined` for an empty body so callers can omit the
 * description entirely rather than emit an empty one.
 */
export function buildSharedNoteExcerpt(content: unknown): string | undefined {
  const text = joinTopLevelBlockText(content);
  if (!text) {
    return undefined;
  }
  if (text.length <= MAX_DESCRIPTION_LENGTH) {
    return text;
  }
  const head = text.slice(0, MAX_DESCRIPTION_LENGTH);
  const lastSpace = head.lastIndexOf(' ');
  // A single word longer than the budget has no boundary to fall back to.
  return `${(lastSpace > 0 ? head.slice(0, lastSpace) : head).trimEnd()}…`;
}

/** Title + excerpt for a shared note, or the unavailable fallback when absent. */
export function buildSharedNoteMeta(
  note: SharedNoteMetaSource | null,
): SharedNoteMeta {
  if (!note) {
    return SHARED_NOTE_UNAVAILABLE_META;
  }
  const title = note.title.trim() || UNTITLED_NOTE_TITLE;
  const description = buildSharedNoteExcerpt(note.content);
  return description ? { title, description } : { title };
}
