'use client';

import type { JSX } from 'react';
import { useParams } from 'next/navigation';
import { NoteDetailPanel } from '@nota/note-editor-ui/note-detail-panel';

/** `/notes/note/[id]` — the open-note editor. */
export default function NotePage(): JSX.Element | null {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return null;
  }
  return <NoteDetailPanel noteId={id} />;
}
