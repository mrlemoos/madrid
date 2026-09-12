'use client';

import { useEffect, type JSX, type ReactNode } from 'react';
import { NotesChrome } from '@getmadrid/notes-chrome-ui/notes-chrome';
import {
  NotesDataProvider,
  type NotesDataProviderPorts,
} from '@getmadrid/note-runtime/notes-data-context';
import { useIsElectron } from '@getmadrid/electron-bridge-ui/use-is-electron';
import { ElectronWindowDragBand } from '@getmadrid/electron-bridge-ui/window-drag-band';
import {
  bootstrapAppNavigation,
  navigateToScreen,
} from '@getmadrid/app-navigation-core/navigation';
import { repairClerkAuthLocationHash } from '@getmadrid/app-navigation-core/clerk-hash';

import { fetchNotaProEntitled } from '@/lib/nota-server-client';
import { runWelcomeNoteSeedIfNeeded } from '@/lib/welcome-note-seed';
import { clearNoteAttachmentSignedUrlCache } from '@getmadrid/data-source/attachment-signed-url-cache';
import { SignedInCommandPalette } from '@getmadrid/note-palette-ui/signed-in-command-palette';
import { cn } from '@/lib/utils';

const notesDataPorts: NotesDataProviderPorts = {
  fetchNotaProEntitled,
  runWelcomeNoteSeedIfNeeded,
  navigateToNote: (noteId) => {
    navigateToScreen({ kind: 'notes', panel: 'note', noteId });
  },
  clearNoteAttachmentSignedUrlCache,
};

export function NotesWorkspace({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const isElectron = useIsElectron();

  useEffect(() => {
    bootstrapAppNavigation();
    repairClerkAuthLocationHash();
    queueMicrotask(repairClerkAuthLocationHash);
  }, []);

  return (
    <div
      className={cn(
        'relative flex h-dvh min-h-0 flex-col text-foreground',
        isElectron ? 'bg-transparent' : 'bg-background',
      )}
    >
      <ElectronWindowDragBand />
      <NotesDataProvider ports={notesDataPorts}>
        <SignedInCommandPalette />
        <NotesChrome>{children}</NotesChrome>
      </NotesDataProvider>
    </div>
  );
}
