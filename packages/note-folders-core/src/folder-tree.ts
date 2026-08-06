import type { Folder } from '@nota/database-types';
import { compareFolderNames } from './note-sidebar-groups';

export type FolderTreeNode = {
  folder: Folder;
  children: FolderTreeNode[];
};

/**
 * Builds a forest of folder tree roots (`parent_id` null), each subtree sorted by name.
 */
export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const byParent = new Map<string | null, Folder[]>();
  for (const f of folders) {
    const p = f.parent_id ?? null;
    let list = byParent.get(p);
    if (!list) {
      list = [];
      byParent.set(p, list);
    }
    list.push(f);
  }
  for (const list of byParent.values()) {
    list.sort(compareFolderNames);
  }

  const build = (parentId: string | null): FolderTreeNode[] => {
    const list = byParent.get(parentId) ?? [];
    return list.map((folder) => ({
      folder,
      children: build(folder.id),
    }));
  };

  return build(null);
}

/** Ancestor folder ids from immediate parent toward the root. */
export function ancestorFolderIds(
  folderId: string,
  folders: Folder[],
): string[] {
  const byId = new Map(folders.map((f) => [f.id, f] as const));
  const result: string[] = [];
  let cur: string | null | undefined = byId.get(folderId)?.parent_id ?? null;
  while (cur) {
    result.push(cur);
    cur = byId.get(cur)?.parent_id ?? null;
  }
  return result;
}

/**
 * This folder id plus every descendant folder id (depth-first from root).
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

/** Same as {@link subtreeFolderIds} (plan / docs naming). */
export const descendantFolderIds = subtreeFolderIds;

export function folderPathLabel(
  folderId: string,
  folders: Folder[],
  pathSeparator: string,
): string {
  const byId = new Map(folders.map((f) => [f.id, f] as const));
  const parts: string[] = [];
  let current: string | undefined = folderId;
  while (current) {
    const row = byId.get(current);
    if (!row) {
      break;
    }
    parts.unshift(row.name);
    current = row.parent_id ?? undefined;
  }
  return parts.join(pathSeparator);
}

export type FolderPathRow = {
  folder: Folder;
  pathLabel: string;
};

/** Depth-first pre-order with path labels (for menus and palette). */
export function flattenFoldersWithPathLabels(
  folders: Folder[],
  pathSeparator: string,
): FolderPathRow[] {
  const tree = buildFolderTree(folders);
  const result: FolderPathRow[] = [];

  const walk = (nodes: FolderTreeNode[], prefix: string[]): void => {
    for (const { folder, children } of nodes) {
      const parts = [...prefix, folder.name];
      result.push({
        folder,
        pathLabel: parts.join(pathSeparator),
      });
      walk(children, parts);
    }
  };

  walk(tree, []);
  return result;
}
