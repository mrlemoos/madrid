'use client';

import type { JSX } from 'react';
import { TipTapEditor } from '@nota/editor';

export interface SharedNoteBodyProps {
  noteId: string;
  content: unknown;
  contentRevision?: string;
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
}: SharedNoteBodyProps): JSX.Element {
  return (
    <TipTapEditor
      readOnly
      content={content}
      noteId={noteId}
      contentRevision={contentRevision}
      placeholder=""
    />
  );
}
