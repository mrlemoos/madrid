/** `Command.Item` value prefix for Move note → pick note rows. */
export const MOVE_PICK_VALUE_PREFIX = 'move-pick:' as const;

/**
 * Parses a cmdk item `value` of the form `move-pick:<noteId>`.
 * Returns `null` if the value is not a move-pick row.
 */
export function parseMovePickNoteId(value: string): string | null {
  if (!value.startsWith(MOVE_PICK_VALUE_PREFIX)) {
    return null;
  }
  const id = value.slice(MOVE_PICK_VALUE_PREFIX.length);
  return id.length > 0 ? id : null;
}

/** Returns a new Set with `id` toggled (add if absent, remove if present). */
export function toggleIdInSet(
  previous: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(previous);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

/**
 * cmdk can leave the controlled `value` state briefly out of sync with the
 * highlighted row while focus stays on the search input. Read the DOM
 * highlight as a fallback (see `data-selected` on cmdk items).
 */
export function readMovePickNoteIdFromHighlightedItem(
  paletteRoot: Element | null,
): string | null {
  if (!paletteRoot) {
    return null;
  }
  const el = paletteRoot.querySelector('[cmdk-item][data-selected="true"]');
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  const raw = el.getAttribute('data-value');
  if (raw == null || raw === '') {
    return null;
  }
  return parseMovePickNoteId(raw);
}

/** `data-value` of the highlighted cmdk item (any command row). */
export function readHighlightedCmdkItemValue(
  paletteRoot: Element | null,
): string | null {
  if (!paletteRoot) {
    return null;
  }
  const el = paletteRoot.querySelector('[cmdk-item][data-selected="true"]');
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  const raw = el.getAttribute('data-value');
  if (raw == null || raw === '') {
    return null;
  }
  return raw;
}
