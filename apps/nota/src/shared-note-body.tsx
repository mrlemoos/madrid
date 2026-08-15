'use client';

import { useMemo, type JSX } from 'react';
import { TipTapEditor, type AttachmentStorageOps } from '@nota/editor';
import type { NoteAttachment } from '@nota/database-types';
import type { SharedNoteAttachment } from '@nota/data-source/note-share-client';

export interface SharedNoteBodyProps {
  noteId: string;
  content: unknown;
  contentRevision?: string;
  /** Share token; scopes every attachment request to this note. */
  token: string;
  attachments: SharedNoteAttachment[];
}

/** Token-scoped URL the app serves attachment bytes from. */
export function attachmentUrl(token: string, attachmentId: string): string {
  return `/s/${encodeURIComponent(token)}/attachment/${encodeURIComponent(attachmentId)}`;
}

/**
 * Read-only note body for the public share page.
 *
 * Split into its own module so the share view can lazy-load it: `useEditor`
 * throws when it detects a server render, and the lazy boundary has to be a
 * local file — dynamically importing `@nota/editor` itself would ban the static
 * imports the rest of the app relies on (`@nx/enforce-module-boundaries`).
 */
export default function SharedNoteBody({
  noteId,
  content,
  contentRevision,
  token,
  attachments,
}: SharedNoteBodyProps): JSX.Element {
  const editorAttachments = useMemo<NoteAttachment[]>(
    () =>
      attachments.map((attachment) => ({
        ...attachment,
        // The public RPC does not expose the note's owner, and no read path here
        // is scoped by user: every request is authorised by the share token.
        user_id: '',
        // Column is nullable in the schema but non-null in the generated row
        // type; only ordering uses it, and the RPC already sorted.
        created_at: attachment.created_at ?? '',
      })),
    [attachments],
  );

  const storageOps = useMemo<AttachmentStorageOps>(() => {
    // The bucket is private, so a viewer cannot mint signed URLs. Every URL
    // points at the app's own token-scoped route, which signs server-side; the
    // URL never expires from the node's point of view, so no refresh is needed.
    const urlFor = (attachmentId: string) => ({
      ok: true as const,
      signedUrl: attachmentUrl(token, attachmentId),
    });
    return {
      getOrFetchSignedUrl: (attachmentId) =>
        Promise.resolve(urlFor(attachmentId)),
      getValidCachedSignedUrl: (attachmentId) => ({
        signedUrl: attachmentUrl(token, attachmentId),
        // Stable URL: park the expiry far enough out that nothing re-fetches.
        expiresAtMs: Number.MAX_SAFE_INTEGER,
      }),
      createRawSignedUrl: () =>
        Promise.resolve({ ok: false as const, error: 'Read-only share' }),
      downloadAttachment: (url, filename) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        anchor.click();
        return Promise.resolve();
      },
      // Mutations are owner-only; a public viewer never reaches these.
      removeStorageFile: () => Promise.resolve(),
      deleteAttachmentRecord: () => Promise.resolve(),
      renameAttachmentRecord: () => Promise.resolve(),
      signedUrlTtlSec: 3600,
    };
  }, [token]);

  return (
    <TipTapEditor
      readOnly
      content={content}
      noteId={noteId}
      contentRevision={contentRevision}
      placeholder=""
      attachments={editorAttachments}
      storageOps={storageOps}
    />
  );
}
