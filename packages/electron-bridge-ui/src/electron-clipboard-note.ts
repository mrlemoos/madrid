import type { Json, Note } from '@getmadrid/database-types';
import { createNote, updateNote } from '@getmadrid/data-source/models/notes';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import { createLocalOnlyNote } from '@getmadrid/notes-offline';
import { isLikelyOnline } from '@getmadrid/data-source/notes-offline-sync';
import { navigateToScreen } from '@getmadrid/app-navigation-core/navigation';
import { uploadNoteAttachmentFile } from '@getmadrid/data-source/pdf-attachment-client';
import {
  clipboardPlainTextToTiptapDoc,
  titleFromClipboardPlainText,
} from '@getmadrid/electron-bridge-core/clipboard-plain-text';
import type { NotaMenubarClipboardPayload } from '@getmadrid/electron-bridge-core/menubar-payload';

function noteImageDoc(attachmentId: string, filename: string): Json {
  return {
    type: 'doc',
    content: [
      {
        type: 'noteImage',
        attrs: { attachmentId, filename },
      },
    ],
  };
}

function base64ToFile(base64: string, filename: string, mime: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

/**
 * Creates a note from a tray “clipboard” payload (plain text or PNG image).
 */
export async function createNoteFromMenubarClipboard(options: {
  userId: string;
  notaProEntitled: boolean;
  clipboard: NotaMenubarClipboardPayload;
  insertNoteAtFront: (n: Note) => void;
  refreshNotesList: (o?: { silent?: boolean }) => Promise<void>;
  patchNoteInList: (id: string, patch: Partial<Note>) => void;
  onError: (message: string) => void;
}): Promise<void> {
  const {
    userId,
    notaProEntitled,
    clipboard,
    insertNoteAtFront,
    refreshNotesList,
    patchNoteInList,
    onError,
  } = options;

  if (!notaProEntitled || !userId) {
    return;
  }

  const goToNote = (id: string): void => {
    navigateToScreen({ kind: 'notes', panel: 'note', noteId: id });
  };

  if (clipboard.kind === 'text') {
    const title = titleFromClipboardPlainText(clipboard.text);
    const content = clipboardPlainTextToTiptapDoc(clipboard.text);

    if (!isLikelyOnline()) {
      const id = await createLocalOnlyNote(userId, title, content);
      goToNote(id);
      await refreshNotesList({ silent: true });
      return;
    }

    const c = getBrowserClient();
    try {
      const row = await createNote(c, userId, title, content);
      insertNoteAtFront(row);
      goToNote(row.id);
      await refreshNotesList({ silent: true });
    } catch {
      const id = await createLocalOnlyNote(userId, title, content);
      goToNote(id);
      await refreshNotesList({ silent: true });
    }
    return;
  }

  if (!isLikelyOnline()) {
    onError('Pasting images requires an internet connection.');
    return;
  }

  const file = base64ToFile(
    clipboard.base64,
    'clipboard.png',
    clipboard.mimeType,
  );

  const c = getBrowserClient();
  try {
    const row = await createNote(c, userId, 'Clipboard');
    insertNoteAtFront(row);
    goToNote(row.id);

    try {
      const record = await uploadNoteAttachmentFile(row.id, userId, file);
      const updated = await updateNote(c, row.id, {
        content: noteImageDoc(record.id, record.filename || 'clipboard.png'),
      });
      patchNoteInList(row.id, { content: updated.content });
      await refreshNotesList({ silent: true });
    } catch (err) {
      onError(
        err instanceof Error
          ? err.message
          : 'Could not upload clipboard image.',
      );
    }
  } catch {
    onError('Could not create a note for the clipboard image.');
  }
}
