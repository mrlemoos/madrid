import { describe, expect, it, vi } from 'vitest';

import {
  createNoteAttachmentRecord,
  deleteNoteAttachment,
  listNoteAttachments,
  NOTE_PDFS_BUCKET,
  noteAttachmentStoragePath,
  updateNoteAttachmentFilename,
} from './note-attachments';
import type { TypedSupabaseClient } from './notes';

function clientReturning(builder: unknown) {
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as TypedSupabaseClient, from };
}

describe('noteAttachmentStoragePath', () => {
  it('scopes the object under the owner and the note', () => {
    // Arrange|Act
    const path = noteAttachmentStoragePath('user-1', 'note-1', 'obj-1', '.pdf');

    // Assert — RLS reads the leading user id segment
    expect(path).toBe('user-1/note-1/obj-1.pdf');
  });

  it('accepts an extension with or without its dot, and lowercases it', () => {
    // Arrange|Act|Assert
    expect(noteAttachmentStoragePath('u', 'n', 'o', 'PNG')).toBe('u/n/o.png');
    expect(noteAttachmentStoragePath('u', 'n', 'o', '.JPG')).toBe('u/n/o.jpg');
  });

  it('refuses an extension outside the allow-list', () => {
    // Arrange|Act|Assert — never let a raw user filename reach the bucket
    expect(() => noteAttachmentStoragePath('u', 'n', 'o', '.exe')).toThrow(
      'Invalid attachment storage extension: .exe',
    );
    expect(() =>
      noteAttachmentStoragePath('u', 'n', 'o', '.pdf.exe'),
    ).toThrow();
  });

  it('names the bucket the paths live in', () => {
    // Arrange|Act|Assert
    expect(NOTE_PDFS_BUCKET).toBe('note-pdfs');
  });
});

describe('listNoteAttachments', () => {
  it('returns the note attachments newest first', async () => {
    // Arrange
    const rows = [{ id: 'att-1' }];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const { client, from } = clientReturning({ select });

    // Act
    const result = await listNoteAttachments(client, 'note-1');

    // Assert
    expect(from).toHaveBeenCalledWith('note_attachments');
    expect(eq).toHaveBeenCalledWith('note_id', 'note-1');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toBe(rows);
  });

  it('reports a failed read', async () => {
    // Arrange
    const order = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } });
    const eq = vi.fn(() => ({ order }));
    const { client } = clientReturning({ select: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(listNoteAttachments(client, 'note-1')).rejects.toThrow(
      'Failed to list note attachments: boom',
    );
  });
});

describe('createNoteAttachmentRecord', () => {
  function insertClient(result: { data: unknown; error: unknown }) {
    const single = vi.fn().mockResolvedValue(result);
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    return { ...clientReturning({ insert }), insert };
  }

  const row = {
    note_id: 'note-1',
    user_id: 'user-1',
    storage_path: 'user-1/note-1/obj-1.pdf',
    filename: 'brief.pdf',
  };

  it('defaults an unknown upload to a PDF and a null size', async () => {
    // Arrange
    const { client, insert } = insertClient({
      data: { id: 'att-1' },
      error: null,
    });

    // Act
    await createNoteAttachmentRecord(client, row);

    // Assert
    expect(insert).toHaveBeenCalledWith({
      ...row,
      content_type: 'application/pdf',
      size_bytes: null,
    });
  });

  it('keeps the content type and size the caller measured', async () => {
    // Arrange
    const { client, insert } = insertClient({
      data: { id: 'att-1' },
      error: null,
    });

    // Act
    await createNoteAttachmentRecord(client, {
      ...row,
      content_type: 'image/png',
      size_bytes: 2048,
    });

    // Assert
    expect(insert).toHaveBeenCalledWith({
      ...row,
      content_type: 'image/png',
      size_bytes: 2048,
    });
  });

  it('reports a failed insert', async () => {
    // Arrange
    const { client } = insertClient({ data: null, error: { message: 'boom' } });

    // Act|Assert
    await expect(createNoteAttachmentRecord(client, row)).rejects.toThrow(
      'Failed to create note attachment: boom',
    );
  });
});

describe('deleteNoteAttachment', () => {
  it('deletes the addressed row', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ error: null });
    const { client, from } = clientReturning({ delete: vi.fn(() => ({ eq })) });

    // Act
    await deleteNoteAttachment(client, 'att-1');

    // Assert
    expect(from).toHaveBeenCalledWith('note_attachments');
    expect(eq).toHaveBeenCalledWith('id', 'att-1');
  });

  it('reports a failed delete', async () => {
    // Arrange
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } });
    const { client } = clientReturning({ delete: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(deleteNoteAttachment(client, 'att-1')).rejects.toThrow(
      'Failed to delete note attachment: boom',
    );
  });
});

describe('updateNoteAttachmentFilename', () => {
  it('renames the display filename without touching the storage path', async () => {
    // Arrange
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: 'att-1' }, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const { client } = clientReturning({ update });

    // Act
    await updateNoteAttachmentFilename(client, 'att-1', 'itinerary.pdf');

    // Assert
    expect(update).toHaveBeenCalledWith({ filename: 'itinerary.pdf' });
    expect(eq).toHaveBeenCalledWith('id', 'att-1');
  });

  it('reports a rename the owner is not allowed to make', async () => {
    // Arrange
    const single = vi
      .fn()
      .mockResolvedValue({
        data: null,
        error: { message: 'row-level security' },
      });
    const eq = vi.fn(() => ({ select: vi.fn(() => ({ single })) }));
    const { client } = clientReturning({ update: vi.fn(() => ({ eq })) });

    // Act|Assert
    await expect(
      updateNoteAttachmentFilename(client, 'att-1', 'x.pdf'),
    ).rejects.toThrow('Failed to rename attachment: row-level security');
  });
});
