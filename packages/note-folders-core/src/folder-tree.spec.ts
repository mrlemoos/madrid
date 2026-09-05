import { describe, expect, it } from 'vitest';
import type { Folder } from '@getmadrid/database-types';
import {
  ancestorFolderIds,
  buildFolderTree,
  flattenFoldersWithPathLabels,
  folderPathLabel,
  subtreeFolderIds,
} from './folder-tree';

const base = {
  user_id: 'u1',
  tint: null as string | null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function f(id: string, name: string, parent_id: string | null = null): Folder {
  return { id, name, parent_id, ...base };
}

describe('folder-tree', () => {
  it('builds a tree sorted by sibling name and respects parent_id', () => {
    // Arrange
    const folders: Folder[] = [
      f('b', 'Bravo', null),
      f('a', 'Alpha', null),
      f('c1', 'Child-one', 'a'),
      f('c2', 'Child-two', 'a'),
    ];

    // Act
    const tree = buildFolderTree(folders);

    // Assert
    expect(tree.map((n) => n.folder.id)).toEqual(['a', 'b']);
    const alpha = tree.find((n) => n.folder.id === 'a');
    expect(alpha?.children.map((c) => c.folder.id)).toEqual(['c1', 'c2']);
    expect(tree.find((n) => n.folder.id === 'b')?.children).toEqual([]);
  });

  it('ancestorFolderIds walks from parent toward root', () => {
    // Arrange
    const folders: Folder[] = [
      f('root', 'Root', null),
      f('mid', 'Mid', 'root'),
      f('leaf', 'Leaf', 'mid'),
    ];

    // Act
    const ancestors = ancestorFolderIds('leaf', folders);

    // Assert
    expect(ancestors).toEqual(['mid', 'root']);
  });

  it('subtreeFolderIds includes root and all descendants', () => {
    // Arrange
    const folders: Folder[] = [
      f('r', 'R', null),
      f('x', 'X', 'r'),
      f('y', 'Y', 'x'),
    ];

    // Act
    const ids = subtreeFolderIds('r', folders);

    // Assert
    expect(new Set(ids)).toEqual(new Set(['r', 'x', 'y']));
    expect(ids[0]).toBe('r');
  });

  it('folderPathLabel joins ancestor names with the separator', () => {
    // Arrange
    const folders: Folder[] = [f('r', 'Work', null), f('p', 'Project', 'r')];
    const sep = ' / ';

    // Act
    const label = folderPathLabel('p', folders, sep);

    // Assert
    expect(label).toBe('Work / Project');
  });

  it('flattenFoldersWithPathLabels is DFS with path labels', () => {
    // Arrange
    const folders: Folder[] = [
      f('b-root', 'B-root', null),
      f('a-root', 'A-root', null),
      f('a1', 'Dup', 'a-root'),
      f('a2', 'Dup', 'b-root'),
    ];
    const sep = ' › ';

    // Act
    const rows = flattenFoldersWithPathLabels(folders, sep);

    // Assert
    expect(rows.map((r) => `${r.folder.id}:${r.pathLabel}`)).toEqual([
      'a-root:A-root',
      'a1:A-root › Dup',
      'b-root:B-root',
      'a2:B-root › Dup',
    ]);
  });
});
