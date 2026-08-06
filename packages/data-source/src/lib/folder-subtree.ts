import type { Folder } from '@nota/database-types';

/**
 * This folder id plus every descendant folder id (depth-first from root).
 *
 * Pure folder-tree math owned locally by `@nota/data-source` so the `models`
 * layer does not reach upward into the app's folder feature cluster. Mirrors
 * `subtreeFolderIds` in the app's `lib/folder-tree`.
 */
export function subtreeFolderIds(
  rootFolderId: string,
  folders: Folder[],
): string[] {
  const byParent = new Map<string | null, string[]>();
  for (const f of folders) {
    const p = f.parent_id ?? null;
    let list = byParent.get(p);
    if (!list) {
      list = [];
      byParent.set(p, list);
    }
    list.push(f.id);
  }

  const result: string[] = [];
  const stack = [rootFolderId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined) {
      break;
    }
    result.push(id);
    const kids = byParent.get(id) ?? [];
    for (const kid of kids.slice().reverse()) {
      stack.push(kid);
    }
  }
  return result;
}
