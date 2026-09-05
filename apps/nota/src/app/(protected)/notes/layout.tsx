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

/**
 * App-owned collaborators for the notes-data runtime spine. Module scope so the
 * ports identity is stable across renders (see `NotesDataProviderPorts`).
 */
const notesDataPorts: NotesDataProviderPorts = {
  fetchNotaProEntitled,
  runWelcomeNoteSeedIfNeeded,
  navigateToNote: (noteId) => {
    navigateToScreen({ kind: 'notes', panel: 'note', noteId });
  },
  clearNoteAttachmentSignedUrlCache,
};

/**
 * Shared layout for the whole notes workspace. Hosts the data provider, command
 * palette, and the persistent `NotesChrome` chrome (sidebar + footer); the active
 * panel is the child route (`page.tsx`), which is the only thing that swaps on nav.
 */
export default function NotesLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const isElectron = useIsElectron();

  // Browser-only boot (formerly main.tsx / notes-workspace): navigation listeners
  // + Clerk auth-hash repair. Runs once on mount.
  useEffect(() => {
    bootstrapAppNavigation();
    repairClerkAuthLocationHash();
    queueMicrotask(() => {
      repairClerkAuthLocationHash();
    });
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
