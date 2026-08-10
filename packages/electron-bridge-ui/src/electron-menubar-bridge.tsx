import { useEffect, useRef } from 'react';
import { useRootLoaderData } from '@nota/note-runtime/session-context';
import { useNotesData } from '@nota/note-runtime/notes-data-context';
import { clientCreateNote } from '@nota/note-folders-ui/create-note-client';
import { startStudyNotesFromRecording } from '@nota/note-capture-ui/audio-to-note-start';
import {
  dispatchMenubarMoveNoteRequest,
  dispatchMenubarNewFolderRequest,
} from '@nota/electron-bridge-core/menubar-events';
import {
  isNotaMenubarActionPayload,
  type NotaMenubarActionPayload,
} from '@nota/electron-bridge-core/menubar-payload';
import { useNotaZoomStore } from '@nota/note-runtime/stores/zoom';
import { createNoteFromMenubarClipboard } from './electron-clipboard-note';

/**
 * Subscribes to Electron menu IPC and runs the corresponding SPA flows.
 */
export function ElectronMenubarBridge(): null {
  const { user } = useRootLoaderData();
  const userId = user?.id ?? '';
  const {
    notes,
    notaProEntitled,
    refreshNotesList,
    insertNoteAtFront,
    patchNoteInList,
  } = useNotesData();

  const stableRef = useRef({
    userId,
    notaProEntitled,
    refreshNotesList,
    insertNoteAtFront,
    patchNoteInList,
    notes,
  });
  stableRef.current = {
    userId,
    notaProEntitled,
    refreshNotesList,
    insertNoteAtFront,
    patchNoteInList,
    notes,
  };

  useEffect(() => {
    const api = window.nota;
    if (typeof api?.subscribeMenubarActions !== 'function') {
      return;
    }
    return api.subscribeMenubarActions((payload: unknown) => {
      if (!isNotaMenubarActionPayload(payload)) {
        return;
      }
      const action: NotaMenubarActionPayload = payload;
      const s = stableRef.current;
      void (async () => {
        if (action.kind === 'create-note') {
          await clientCreateNote({
            userId: s.userId,
            insertNoteAtFront: s.insertNoteAtFront,
            refreshNotesList: s.refreshNotesList,
            notaProEntitled: s.notaProEntitled,
            notes: s.notes,
          });
          return;
        }
        if (action.kind === 'create-folder') {
          if (!s.notaProEntitled) {
            return;
          }
          dispatchMenubarNewFolderRequest();
          return;
        }
        if (action.kind === 'move-note') {
          if (!s.notaProEntitled) {
            return;
          }
          dispatchMenubarMoveNoteRequest();
          return;
        }
        if (
          action.kind === 'zoom-in' ||
          action.kind === 'zoom-out' ||
          action.kind === 'zoom-reset'
        ) {
          const zoom = useNotaZoomStore.getState();
          if (action.kind === 'zoom-in') {
            zoom.zoomIn();
          } else if (action.kind === 'zoom-out') {
            zoom.zoomOut();
          } else {
            zoom.resetZoom();
          }
          return;
        }
        if (action.kind === 'study-recording') {
          await startStudyNotesFromRecording({
            userId: s.userId,
            notaProEntitled: s.notaProEntitled,
            insertNoteAtFront: s.insertNoteAtFront,
            refreshNotesList: s.refreshNotesList,
          });
          return;
        }
        await createNoteFromMenubarClipboard({
          userId: s.userId,
          notaProEntitled: s.notaProEntitled,
          clipboard: action.clipboard,
          insertNoteAtFront: s.insertNoteAtFront,
          refreshNotesList: s.refreshNotesList,
          patchNoteInList: s.patchNoteInList,
          onError: (message) => {
            window.alert(message);
          },
        });
      })();
    });
  }, []);

  return null;
}
