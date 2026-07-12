import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TipTapEditor } from '@nota/editor';
import type { NoteAttachment } from '@nota/database-types';

const SIGNED_IMAGE_URL = 'https://cdn.example.test/image-signed.webp';

function createAttachment(overrides?: Partial<NoteAttachment>): NoteAttachment {
  return {
    id: 'att-image-1',
    note_id: 'note-1',
    user_id: 'user-1',
    storage_path: 'notes/user-1/note-1/image.webp',
    filename: 'Image.webp',
    content_type: 'image/webp',
    size_bytes: 1234,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TipTap image preview interaction', () => {
  it('opens image preview callback when image is clicked', async () => {
    // Arrange
    const onImagePreviewRequest = vi.fn();
    const attachment = createAttachment();

    render(
      <TipTapEditor
        content={{
          type: 'doc',
          content: [
            {
              type: 'noteImage',
              attrs: {
                attachmentId: attachment.id,
                filename: attachment.filename,
                align: 'left',
              },
            },
          ],
        }}
        onUpdate={() => {}}
        noteId="note-1"
        userId="user-1"
        noteMentionCandidates={[]}
        attachments={[attachment]}
        storageOps={{
          signedUrlTtlSec: 3600,
          getValidCachedSignedUrl: () => ({
            signedUrl: SIGNED_IMAGE_URL,
            expiresAtMs: Date.now() + 60_000,
          }),
          getOrFetchSignedUrl: async () => ({
            ok: true,
            signedUrl: SIGNED_IMAGE_URL,
          }),
          createRawSignedUrl: async () => ({
            ok: true,
            signedUrl: SIGNED_IMAGE_URL,
          }),
          downloadAttachment: async () => {},
          removeStorageFile: async () => {},
          deleteAttachmentRecord: async () => {},
          renameAttachmentRecord: async () => {},
        }}
        onImagePreviewRequest={onImagePreviewRequest}
      />,
    );

    const image = await screen.findByTestId('note-image-asset');

    // Act
    fireEvent.click(image);

    // Assert
    await waitFor(() => {
      expect(onImagePreviewRequest).toHaveBeenCalledWith({
        src: SIGNED_IMAGE_URL,
        alt: attachment.filename,
        filename: attachment.filename,
      });
    });
  });
});
