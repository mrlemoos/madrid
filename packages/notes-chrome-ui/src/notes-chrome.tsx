import {
  useEffect,
  useLayoutEffect,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { TooltipProvider } from '@getmadrid/design/tooltip';
import { LoadingStatus } from '@getmadrid/design/spinner';
import { ELECTRON_WINDOW_NO_DRAG_CLASS } from '@getmadrid/electron-bridge-core/window-chrome';
import {
  notesMainChrome,
  notesSidebarChrome,
  notesStickyTitleChrome,
} from '@getmadrid/notes-chrome-core/notes-chrome';
import { cn } from '@getmadrid/design/utils';
import { useStickyDocTitle } from '@getmadrid/note-runtime/sticky-doc-title';
import { useIsElectron } from '@getmadrid/electron-bridge-ui/use-is-electron';
import { useNotesOfflineSync } from '@getmadrid/note-runtime/use-notes-offline-sync';
import { useNotesHistoryShortcut } from '@getmadrid/app-navigation-ui/use-notes-history-shortcut';
import { useNotesSidebarShortcut } from '@getmadrid/app-navigation-ui/use-notes-sidebar-shortcut';
import { useCreateFolderShortcut } from '@getmadrid/note-folders-ui/use-create-folder-shortcut';
import { useSettingsShortcut } from '@getmadrid/app-navigation-ui/use-settings-shortcut';
import { useNotaZoomShortcut } from '@getmadrid/app-navigation-ui/use-nota-zoom-shortcut';
import { useTodaysNoteShortcut } from '@getmadrid/app-navigation-ui/use-todays-note-shortcut';
import {
  useSyncUserPreferences,
  useSyncClerkDisplayName,
} from '@getmadrid/note-runtime/use-sync-user-preferences';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';
import { useNotesSidebarMotion } from '@getmadrid/nota-motion-ui/use-notes-sidebar-motion';
import { useNotesSidebarResize } from '@getmadrid/nota-motion-ui/use-notes-sidebar-resize';
import { hasJournalNotes } from '@getmadrid/note-journal-core/notes';
import { useNotesSidebarStore } from '@getmadrid/note-runtime/stores/sidebar';
import { useRootLoaderData } from '@getmadrid/note-runtime/session-context';
import { useNotesData } from '@getmadrid/note-runtime/notes-data-context';
import { useAppNavigationScreen } from '@getmadrid/app-navigation-ui/use-app-navigation-screen';
import {
  pathForScreen,
  replaceScreen,
  type NotesPanel,
} from '@getmadrid/app-navigation-core/navigation';
import { NOTA_MENUBAR_NEW_FOLDER_REQUEST_EVENT } from '@getmadrid/electron-bridge-core/menubar-events';
import { FolderCreateDialog } from '@getmadrid/note-folders-ui/folder-create-dialog';
import { NotesSidebarList } from './notes-sidebar-list';
import { AudioToNoteDock } from '@getmadrid/note-capture-ui/audio-to-note-dock';
import { ElectronMenubarBridge } from '@getmadrid/electron-bridge-ui/menubar-bridge';
import { ElectronTrafficLightsController } from '@getmadrid/electron-bridge-ui/traffic-lights-controller';
import { StudyRecordingUploadWarningBanner } from '@getmadrid/note-capture-ui/study-recording-upload-warning-banner';
import { useAudioNotePendingDrain } from '@getmadrid/note-capture-ui/use-audio-note-pending-drain';
import { useNotesChromeTranslator } from './use-notes-chrome-translator';
import {
  ChromeNavLinks,
  SidebarIconRail,
  SidebarToggle,
  type ChromeNavItem,
} from './notes-chrome-parts';
import { NotesSidebarResizeHandle } from '@getmadrid/nota-motion-ui/notes-sidebar-resize-handle';

/**
 * Persistent chrome for the notes workspace: sidebar (vault list), footer nav, the
 * paywall banner, and all the workspace hooks/shortcuts. Rendered as the shared
 * `(protected)/notes/layout.tsx`; the active panel is the route `children`, so the
 * sidebar never remounts while the main content is a real page route.
 */
type NotesChromeProps = {
  children: ReactNode;
};

export function NotesChrome({ children }: NotesChromeProps): JSX.Element {
  const screen = useAppNavigationScreen();
  const panel: NotesPanel = screen.kind === 'notes' ? screen.panel : 'list';
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
  const chromeReady = !loading;
  const paywalled = Boolean(user && chromeReady && !notaProEntitled);
  const showVaultLoading = Boolean(user?.id && loading);
  const sidebarChromeMounted = !paywalled && !showVaultLoading;
  const { asideRef, railRef } = useNotesSidebarMotion({
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
  const openNoteHasBanner = Boolean(
    routeNoteId &&
      notes.find((note) => note.id === routeNoteId)?.banner_attachment_id,
  );

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

  useNotesHistoryShortcut(user?.id, chromeReady);
  useNotesSidebarShortcut(user?.id, chromeReady);
  useSettingsShortcut(user?.id, chromeReady);
  useNotaZoomShortcut(user?.id, chromeReady);
  useTodaysNoteShortcut(
    notes,
    user?.id,
    openTodaysNoteShortcut && chromeReady,
    notaProEntitled,
  );
  useCreateFolderShortcut(
    user?.id,
    Boolean(user?.id && chromeReady && notaProEntitled),
    () => {
      setFolderCreateOpen(true);
    },
  );

  useEffect(() => {
    function onNewFolderRequest(): void {
      if (!user?.id || !notaProEntitled || !chromeReady) {
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
  }, [notaProEntitled, chromeReady, user?.id]);

  useNotesOfflineSync(user?.id, notaProEntitled && chromeReady);

  useAudioNotePendingDrain(Boolean(user?.id && notaProEntitled && chromeReady));

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

  const navItems: ChromeNavItem[] = [
    {
      key: 'graph',
      href: graphHref,
      label: t('Note Graph'),
      icon: 'brain-circuit',
      active: panel === 'graph',
    },
    {
      key: 'shortcuts',
      href: shortcutsHref,
      label: t('Shortcuts'),
      icon: 'sparkles',
      active: panel === 'shortcuts',
    },
    {
      key: 'settings',
      href: settingsHref,
      label: t('Settings'),
      icon: 'gear',
      active: panel === 'settings',
    },
    ...(showJournalNav
      ? [
          {
            key: 'journal',
            href: journalHref,
            label: t('Journal'),
            icon: 'clock',
            active: panel === 'journal',
          } satisfies ChromeNavItem,
        ]
      : []),
  ];

  return (
    <>
      <ElectronMenubarBridge />
      <ElectronTrafficLightsController hasBanner={openNoteHasBanner} />
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
            'nota-notes-root relative flex h-full min-h-0 flex-1 bg-linear-to-b from-muted/25 to-background',
          )}
        >
          {!paywalled ? (
            <>
              <aside
                ref={asideRef}
                className={cn(
                  'relative flex h-full min-h-0 min-w-0 shrink-0 flex-col overflow-hidden',
                  isElectron && 'z-[35]',
                  notesSidebarChrome,
                )}
              >
                <div
                  ref={railRef}
                  data-nota-sidebar-rail
                  className={cn(
                    'flex h-full min-h-0 w-full min-w-0 flex-col',
                    !open && 'pointer-events-none',
                  )}
                  style={{ width: widthPx }}
                  aria-hidden={!open}
                  inert={!open ? true : undefined}
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
                        <ChromeNavLinks items={navItems} />
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
              {!open ? (
                <TooltipProvider>
                  <SidebarIconRail items={navItems} />
                </TooltipProvider>
              ) : null}
            </>
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
                    'An active Madrid subscription is required to write and sync notes.',
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
