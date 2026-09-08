import { describe, expect, it } from 'vitest';
import type { Folder } from '@getmadrid/database-types';

import { subtreeFolderIds } from './folder-subtree';

function folder(id: string, parent_id: string | null): Folder {
  return { id, parent_id } as Folder;
}

describe('subtreeFolderIds', () => {
  it('includes the root itself even when it has no children', () => {
    // Arrange
    const folders = [folder('root', null)];

    // Act|Assert
    expect(subtreeFolderIds('root', folders)).toEqual(['root']);
  });

  it('walks descendants depth-first in declaration order', () => {
    // Arrange
    const folders = [
      folder('root', null),
      folder('a', 'root'),
      folder('a1', 'a'),
      folder('a2', 'a'),
      folder('b', 'root'),
    ];

    // Act
    const ids = subtreeFolderIds('root', folders);

    // Assert
    expect(ids).toEqual(['root', 'a', 'a1', 'a2', 'b']);
  });

  it('takes only the branch under the given folder', () => {
    // Arrange
    const folders = [
      folder('root', null),
      folder('a', 'root'),
      folder('a1', 'a'),
      folder('b', 'root'),
      folder('b1', 'b'),
    ];

    // Act|Assert
    expect(subtreeFolderIds('a', folders)).toEqual(['a', 'a1']);
  });

  it('returns the root alone when the folder is unknown to the list', () => {
    // Arrange|Act|Assert — the caller still wants to act on the id it holds
    expect(subtreeFolderIds('ghost', [folder('root', null)])).toEqual([
      'ghost',
    ]);
  });
});
