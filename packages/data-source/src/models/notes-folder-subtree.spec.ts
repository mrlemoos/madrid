import { describe, expect, it, vi } from 'vitest';
import type { Folder } from '~/types/database.types';
import { moveAllNotesInFolderSubtree } from './notes';
import type { TypedSupabaseClient } from './notes';

const baseFolder = {
  user_id: 'u1',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function makeFolder(
  id: string,
  name: string,
  parent_id: string | null,
): Folder {
  return { id, name, parent_id, ...baseFolder };
}

describe('moveAllNotesInFolderSubtree', () => {
  it('updates notes whose folder_id is in the deleted root subtree', async () => {
    // Arrange
    const folders: Folder[] = [
      makeFolder('root', 'Root', null),
      makeFolder('child', 'Child', 'root'),
    ];
    const inMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn(() => ({ in: inMock }));
    const fromMock = vi.fn(() => ({ update: updateMock }));
    const client = { from: fromMock } as unknown as TypedSupabaseClient;

    // Act
    await moveAllNotesInFolderSubtree(client, 'root', null, folders);

    // Assert
    expect(fromMock).toHaveBeenCalledWith('notes');
    expect(updateMock).toHaveBeenCalledWith({ folder_id: null });
    expect(inMock).toHaveBeenCalledWith('folder_id', ['root', 'child']);
  });
});
