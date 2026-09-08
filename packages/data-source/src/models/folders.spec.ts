import { describe, expect, it, vi } from 'vitest';
import type { Folder } from '@getmadrid/database-types';

import {
  countNotesInFolder,
  createFolder,
  deleteFolderById,
  folderHasChildFolders,
  listFolders,
  updateFolder,
} from './folders';
import type { TypedSupabaseClient } from './notes';

function clientReturning(builder: unknown) {
  const from = vi.fn(() => builder);
  return {
    client: { from } as unknown as TypedSupabaseClient,
    from,
  };
}

describe('listFolders', () => {
  it('lists folders alphabetically', async () => {
    // Arrange
    const rows: Folder[] = [{ id: 'f1', name: 'Archive' } as Folder];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn(() => ({ order }));
    const { client, from } = clientReturning({ select });

    // Act
    const result = await listFolders(client);

    // Assert
    expect(from).toHaveBeenCalledWith('folders');
    expect(order).toHaveBeenCalledWith('name', { ascending: true });
    expect(result).toBe(rows);
  });

  it('reports a failed read', async () => {
    // Arrange
    const order = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { client } = clientReturning({ select: vi.fn(() => ({ order })) });

    // Act|Assert
    await expect(listFolders(client)).rejects.toThrow(
      'Failed to list folders: boom',
    );
  });
});

describe('createFolder', () => {
  function insertClient(result: { data: unknown; error: unknown }) {
    const single = vi.fn().mockResolvedValue(result);
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    return { ...clientReturning({ insert }), insert };
  }

  it('trims the name and defaults the folder to the root', async () => {
    // Arrange
    const { client, insert } = insertClient({
      data: { id: 'f1' },
      error: null,
    });

    // Act
    await createFolder(client, 'user-1', '  Reading  ');

    // Assert
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'Reading',
      parent_id: null,
    });
  });

  it('names a blank folder rather than storing an empty string', async () => {
    // Arrange
    const { client, insert } = insertClient({
      data: { id: 'f1' },
      error: null,
    });

    // Act
    await createFolder(client, 'user-1', '   ', 'parent-1');

    // Assert
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'Untitled folder',
      parent_id: 'parent-1',
    });
  });

  it('reports a failed insert', async () => {
    // Arrange
    const { client } = insertClient({ data: null, error: { message: 'boom' } });

    // Act|Assert
    await expect(createFolder(client, 'user-1', 'Reading')).rejects.toThrow(
      'Failed to create folder: boom',
    );
  });
});

describe('updateFolder', () => {
  it('patches only the given fields on the addressed folder', async () => {
    // Arrange
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: 'f1' }, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const { client } = clientReturning({ update });

    // Act
    await updateFolder(client, 'f1', { name: 'Reading', tint: 'sage' });

    // Assert
    expect(update).toHaveBeenCalledWith({ name: 'Reading', tint: 'sage' });
    expect(eq).toHaveBeenCalledWith('id', 'f1');
  });

  it('reports a failed update', async () => {
    // Arrange
    const single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } });
    const eq = vi.fn(() => ({ select: vi.fn(() => ({ single })) }));
    const { client } = clientReturning({ update: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(updateFolder(client, 'f1', { name: 'x' })).rejects.toThrow(
      'Failed to update folder: boom',
    );
  });
});

describe('deleteFolderById', () => {
  it('deletes the addressed folder', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn(() => ({ eq }));
    const { client, from } = clientReturning({ delete: del });

    // Act
    await deleteFolderById(client, 'f1');

    // Assert
    expect(from).toHaveBeenCalledWith('folders');
    expect(eq).toHaveBeenCalledWith('id', 'f1');
  });

  it('reports a failed delete', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } });
    const { client } = clientReturning({ delete: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(deleteFolderById(client, 'f1')).rejects.toThrow(
      'Failed to delete folder: boom',
    );
  });
});

describe('countNotesInFolder', () => {
  it('counts without pulling any rows back', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ count: 3, error: null });
    const select = vi.fn(() => ({ eq }));
    const { client, from } = clientReturning({ select });

    // Act
    const count = await countNotesInFolder(client, 'f1');

    // Assert
    expect(from).toHaveBeenCalledWith('notes');
    expect(select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(eq).toHaveBeenCalledWith('folder_id', 'f1');
    expect(count).toBe(3);
  });

  it('reads a null count as empty', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ count: null, error: null });
    const { client } = clientReturning({ select: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(countNotesInFolder(client, 'f1')).resolves.toBe(0);
  });

  it('reports a failed count', async () => {
    // Arrange
    const eq = vi
      .fn()
      .mockResolvedValue({ count: null, error: { message: 'boom' } });
    const { client } = clientReturning({ select: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(countNotesInFolder(client, 'f1')).rejects.toThrow(
      'Failed to count notes in folder: boom',
    );
  });
});

describe('folderHasChildFolders', () => {
  it('is true when at least one child folder exists', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ count: 1, error: null });
    const { client } = clientReturning({ select: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(folderHasChildFolders(client, 'f1')).resolves.toBe(true);
    expect(eq).toHaveBeenCalledWith('parent_id', 'f1');
  });

  it('is false for a leaf folder', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ count: 0, error: null });
    const { client } = clientReturning({ select: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(folderHasChildFolders(client, 'f1')).resolves.toBe(false);
  });

  it('reports a failed count', async () => {
    // Arrange
    const eq = vi
      .fn()
      .mockResolvedValue({ count: null, error: { message: 'boom' } });
    const { client } = clientReturning({ select: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(folderHasChildFolders(client, 'f1')).rejects.toThrow(
      'Failed to count child folders: boom',
    );
  });
});
