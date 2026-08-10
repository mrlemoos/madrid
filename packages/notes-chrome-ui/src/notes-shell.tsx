import {
  useEffect,
  useLayoutEffect,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { Icon } from '@nota/design/icon';
import { TooltipProvider } from '@nota/design/tooltip';
import { LoadingStatus } from '@nota/design/spinner';
import { ELECTRON_WINDOW_NO_DRAG_CLASS } from '@nota/electron-bridge-core/window-chrome';
import {
  notesMainChrome,
  notesSidebarChrome,
  notesStickyTitleChrome,
} from '@nota/notes-chrome-core/shell-chrome';
import { cn } from '@nota/design/utils';
import { useStickyDocTitle } from '@nota/note-runtime/sticky-doc-title';
import { useIsElectron } from '@nota/electron-bridge-ui/use-is-electron';
import { useNotesOfflineSync } from '@nota/note-runtime/use-notes-offline-sync';
import { useNotesHistoryShortcut } from '@nota/app-navigation-ui/use-notes-history-shortcut';
import { useNotesSidebarShortcut } from '@nota/app-navigation-ui/use-notes-sidebar-shortcut';
import { useCreateFolderShortcut } from '@nota/note-folders-ui/use-create-folder-shortcut';
import { useSettingsShortcut } from '@nota/app-navigation-ui/use-settings-shortcut';
import { useNotaZoomShortcut } from '@nota/app-navigation-ui/use-nota-zoom-shortcut';
import { useTodaysNoteShortcut } from '@nota/app-navigation-ui/use-todays-note-shortcut';
import {
  useSyncUserPreferences,
  useSyncClerkDisplayName,
} from '@nota/note-runtime/use-sync-user-preferences';
import { useNotaPreferencesStore } from '@nota/note-runtime/stores/preferences';
import { useNotesSidebarShellMotion } from '@nota/nota-motion-ui/use-notes-sidebar-shell-motion';
import { useNotesSidebarResize } from '@nota/nota-motion-ui/use-notes-sidebar-resize';
import { hasJournalNotes } from '@nota/note-journal-core/notes';
import {
  NOTA_PRESSABLE_CLASS,
  NOTA_SHELL_NAV_ITEM_CLASS,
} from '@nota/nota-motion-ui/interaction';
import { useNotesSidebarStore } from '@nota/note-runtime/stores/sidebar';
import { useRootLoaderData } from '@nota/note-runtime/session-context';
import { useNotesData } from '@nota/note-runtime/notes-data-context';
import { useAppNavigationScreen } from '@nota/app-navigation-ui/use-app-navigation-screen';
import {
  pathForScreen,
  replaceScreen,
  type NotesShellPanel,
} from '@nota/app-navigation-core/navigation';
import { markNavIntent } from '@nota/nota-motion-ui/panel-motion';
import Link from 'next/link';
import { NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT } from '@nota/electron-bridge-core/menubar-events';
import { FolderCreateDialog } from '@nota/note-folders-ui/folder-create-dialog';
import { NotesSidebarList } from './notes-sidebar-list';
import { AudioToNoteDock } from '@nota/note-capture-ui/audio-to-note-dock';
import { ElectronMenubarBridge } from '@nota/electron-bridge-ui/menubar-bridge';
import { ElectronTrafficLightsController } from '@nota/electron-bridge-ui/traffic-lights-controller';
import { StudyRecordingUploadWarningBanner } from '@nota/note-capture-ui/study-recording-upload-warning-banner';
import { useAudioNotePendingDrain } from '@nota/note-capture-ui/use-audio-note-pending-drain';
import { useNotesChromeTranslator } from './use-notes-chrome-translator';
import { SidebarToggle } from './notes-shell-parts';
import { NotesSidebarResizeHandle } from '@nota/nota-motion-ui/notes-sidebar-resize-handle';

/**
 * Persistent chrome for the notes workspace: sidebar (vault list), footer nav, the
 * paywall banner, and all the workspace hooks/shortcuts. Rendered as the shared
 * `(protected)/notes/layout.tsx`; the active panel is the route `children`, so the
 * sidebar never remounts while the main content is a real page route.
 */
type NotesShellProps = {
  children: ReactNode;
};

export function NotesShell({ children }: NotesShellProps): JSX.Element {
  const screen = useAppNavigationScreen();
  const panel: NotesShellPanel =
    screen.kind === 'notes' ? screen.panel : 'list';
  const routeNoteId =
    screen.kind === 'notes' && screen.panel === 'note' ? screen.noteId : null;

  const {
    notes,
    folders,
    loadError,
    userPreferences,
    notaProEntitled,
    loading,
    refreshNotesList,
    insertNoteAtFront,
    patchNoteInList,
    insertFolderSorted,
    patchFolderInList,
    removeNoteFromList,
    removeFolderFromList,
    setUserPreferencesInState,
  } = useNotesData();
  const { open, widthPx, setSidebarWidthPx } = useNotesSidebarStore();
  const { user } = useRootLoaderData();
  const shellReady = !loading;
  const paywalled = Boolean(user && shellReady && !notaProEntitled);
  const showVaultLoading = Boolean(user?.id && loading);
  const sidebarChromeMounted = !paywalled && !showVaultLoading;
  const { asideRef, railRef } = useNotesSidebarShellMotion({
    open,
    widthPx,
    mounted: sidebarChromeMounted,
  });
  const { onResizePointerDown } = useNotesSidebarResize({
    asideRef,
    railRef,
    open,
    widthPx,
    setSidebarWidthPx,
  });
  const { registerScrollRoot, resetSticky, sticky } = useStickyDocTitle();
  const isElectron = useIsElectron();
  const openTodaysNoteShortcut = useNotaPreferencesStore(
    (s) => s.openTodaysNoteShortcut,
  );
  const [folderCreateOpen, setFolderCreateOpen] = useState(false);
  const { t } = useNotesChromeTranslator();

  useSyncUserPreferences(
    userPreferences,
    user?.id,
    setUserPreferencesInState,
    notaProEntitled,
  );

  useSyncClerkDisplayName(
    userPreferences,
    user?.id,
    setUserPreferencesInState,
    notaProEntitled,
  );

  useNotesHistoryShortcut(user?.id, shellReady);
  useNotesSidebarShortcut(user?.id, shellReady);
  useSettingsShortcut(user?.id, shellReady);
  useNotaZoomShortcut(user?.id, shellReady);
  useTodaysNoteShortcut(
    notes,
    user?.id,
    openTodaysNoteShortcut && shellReady,
    notaProEntitled,
  );
  useCreateFolderShortcut(
    user?.id,
    Boolean(user?.id && shellReady && notaProEntitled),
    () => {
      setFolderCreateOpen(true);
    },
  );

  useEffect(() => {
    function onNewFolderRequest(): void {
      if (!user?.id || !notaProEntitled || !shellReady) {
        return;
      }
      setFolderCreateOpen(true);
    }

    window.addEventListener(
      NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT,
      onNewFolderRequest,
    );
    return () => {
      window.removeEventListener(
        NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT,
        onNewFolderRequest,
      );
    };
  }, [notaProEntitled, shellReady, user?.id]);

  useNotesOfflineSync(user?.id, notaProEntitled && shellReady);

  useAudioNotePendingDrain(Boolean(user?.id && notaProEntitled && shellReady));

  useLayoutEffect(() => {
    if (!paywalled) {
      return;
    }
    if (panel === 'settings') {
      return;
    }
    replaceScreen({ kind: 'notes', panel: 'settings', noteId: null });
  }, [paywalled, panel]);

  useEffect(() => {
    return () => {
      registerScrollRoot(null);
      resetSticky();
    };
  }, [registerScrollRoot, resetSticky]);

  const graphHref = pathForScreen({
    kind: 'notes',
    panel: 'graph',
    noteId: null,
  });
  const settingsHref = pathForScreen({
    kind: 'notes',
    panel: 'settings',
    noteId: null,
  });
  const shortcutsHref = pathForScreen({
    kind: 'notes',
    panel: 'shortcuts',
    noteId: null,
  });
  const journalHref = pathForScreen({
    kind: 'notes',
    panel: 'journal',
    noteId: null,
  });
  const showJournalNav = hasJournalNotes(notes);

  return (
    <>
      <ElectronMenubarBridge />
      <ElectronTrafficLightsController />
      {sticky.visible && sticky.label ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-[max(0.5rem,env(safe-area-inset-top))]"
          aria-hidden
        >
          <span className={notesStickyTitleChrome}>{sticky.label}</span>
        </div>
      ) : null}
      {showVaultLoading ? (
        <div
          className={cn(
            'flex h-full min-h-0 flex-1 items-center justify-center',
            'bg-linear-to-b from-muted/25 to-background text-muted-foreground',
          )}
        >
          <LoadingStatus label={t('Loading notes…')} />
        </div>
      ) : (
        <div
          className={cn(
            'nota-notes-root flex h-full min-h-0 flex-1 bg-linear-to-b from-muted/25 to-background',
          )}
        >
          {!paywalled && !open ? (
            <div
              className={cn(
                'fixed z-40 flex items-center',
                isElectron
                  ? 'pointer-events-none top-0 left-0 min-h-[52px] pl-20 pt-[env(safe-area-inset-top)]'
                  : 'left-4 top-4',
              )}
            >
              <SidebarToggle
                className={cn(isElectron && 'pointer-events-auto')}
              />
            </div>
          ) : null}
          {!paywalled ? (
            <aside
              ref={asideRef}
              className={cn(
                'relative flex h-full min-h-0 min-w-0 shrink-0 flex-col overflow-hidden',
                isElectron && 'z-[35]',
                notesSidebarChrome,
                !open && 'pointer-events-none',
              )}
              aria-hidden={!open}
            >
              <div
                ref={railRef}
                data-nota-sidebar-rail
                className="flex h-full min-h-0 w-full min-w-0 flex-col"
                style={{ width: widthPx }}
              >
                <TooltipProvider>
                  <div
                    className={cn(
                      'flex shrink-0 items-center justify-end pr-4 pb-4',
                      isElectron
                        ? cn(
                            'relative z-40 pl-20 pt-[max(1rem,env(safe-area-inset-top))]',
                            ELECTRON_WINDOW_NO_DRAG_CLASS,
                          )
                        : 'pl-4 pt-4',
                    )}
                  >
                    <SidebarToggle />
                  </div>

                  {loadError && (
                    <div
                      className="m-4 shrink-0 rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {loadError}
                    </div>
                  )}

                  <nav className="min-h-0 flex-1 overflow-y-auto p-2">
                    <NotesSidebarList
                      notes={notes}
                      folders={folders}
                      panel={panel}
                      routeNoteId={routeNoteId}
                      userId={user?.id}
                      notaProEntitled={notaProEntitled}
                      userPreferences={userPreferences}
                      insertNoteAtFront={insertNoteAtFront}
                      insertFolderSorted={insertFolderSorted}
                      patchNoteInList={patchNoteInList}
                      patchFolderInList={patchFolderInList}
                      removeNoteFromList={removeNoteFromList}
                      removeFolderFromList={removeFolderFromList}
                      refreshNotesList={refreshNotesList}
                    />
                  </nav>
                  <FolderCreateDialog
                    open={folderCreateOpen}
                    onOpenChange={setFolderCreateOpen}
                    userId={user?.id}
                    insertFolderSorted={insertFolderSorted}
                    refreshNotesList={refreshNotesList}
                  />

                  {user ? (
                    <footer className="mt-auto shrink-0 border-t border-border/40 p-3">
                      <div className="flex flex-col gap-3">
                        <Link
                          href={graphHref}
                          aria-current={panel === 'graph' ? 'page' : undefined}
                          onClick={() => {
                            markNavIntent('pointer');
                          }}
                          className={cn(
                            NOTA_SHELL_NAV_ITEM_CLASS,
                            NOTA_PRESSABLE_CLASS,
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                            panel === 'graph'
                              ? 'bg-muted font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <span className="inline-flex shrink-0" aria-hidden>
                            <Icon name="brain-circuit" size={16} />
                          </span>
                          {t('Note Graph')}
                        </Link>
                        <Link
                          href={shortcutsHref}
                          aria-current={
                            panel === 'shortcuts' ? 'page' : undefined
                          }
                          onClick={() => {
                            markNavIntent('pointer');
                          }}
                          className={cn(
                            NOTA_SHELL_NAV_ITEM_CLASS,
                            NOTA_PRESSABLE_CLASS,
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                            panel === 'shortcuts'
                              ? 'bg-muted font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <span className="inline-flex shrink-0" aria-hidden>
                            <Icon name="sparkles" size={16} />
                          </span>
                          {t('Shortcuts')}
                        </Link>
                        <Link
                          href={settingsHref}
                          aria-current={
                            panel === 'settings' ? 'page' : undefined
                          }
                          onClick={() => {
                            markNavIntent('pointer');
                          }}
                          className={cn(
                            NOTA_SHELL_NAV_ITEM_CLASS,
                            NOTA_PRESSABLE_CLASS,
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                            panel === 'settings'
                              ? 'bg-muted font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                          )}
                        >
                          <span className="inline-flex shrink-0" aria-hidden>
                            <Icon name="gear" size={16} />
                          </span>
                          {t('Settings')}
                        </Link>
                        {showJournalNav ? (
                          <Link
                            href={journalHref}
                            aria-current={
                              panel === 'journal' ? 'page' : undefined
                            }
                            onClick={() => {
                              markNavIntent('pointer');
                            }}
                            className={cn(
                              NOTA_SHELL_NAV_ITEM_CLASS,
                              NOTA_PRESSABLE_CLASS,
                              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                              panel === 'journal'
                                ? 'bg-muted font-medium text-foreground'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                            )}
                          >
                            <span className="inline-flex shrink-0" aria-hidden>
                              <Icon name="clock" size={16} />
                            </span>
                            {t('Journal')}
                          </Link>
                        ) : null}
                      </div>
                    </footer>
                  ) : null}
                </TooltipProvider>
                {open ? (
                  <NotesSidebarResizeHandle
                    ariaLabel={t('Resize sidebar')}
                    onPointerDown={onResizePointerDown}
                  />
                ) : null}
              </div>
            </aside>
          ) : null}

          <main
            ref={registerScrollRoot}
            className={cn(
              'min-h-0 flex-1 overflow-auto',
              '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
              notesMainChrome,
              paywalled
                ? isElectron
                  ? 'pt-[max(1rem,env(safe-area-inset-top))]'
                  : 'pt-8'
                : isElectron
                  ? 'pt-[max(3.5rem,calc(env(safe-area-inset-top)+2.75rem))]'
                  : 'pt-16',
            )}
          >
            {paywalled ? (
              <div
                className="border-b border-border/60 bg-muted/20 px-4 py-4 text-center"
                role="status"
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(
                    'An active Nota subscription is required to write and sync notes.',
                  )}{' '}
                  {t('Choose a plan in')}{' '}
                  <span className="font-medium text-foreground">
                    {t('Settings')}
                  </span>{' '}
                  {t('below.')}
                </p>
              </div>
            ) : null}
            {children}
          </main>
        </div>
      )}
      {!paywalled ? (
        <>
          <StudyRecordingUploadWarningBanner />
          <AudioToNoteDock />
        </>
      ) : null}
    </>
  );
}
