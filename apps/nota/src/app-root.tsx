import {
  useEffect,
  useLayoutEffect,
  lazy,
  type JSX,
  type ReactNode,
} from 'react';
import { LandingPage } from './components/landing-page';
import {
  NotesShell,
  type NotesShellRouteComponents,
} from '@nota/notes-chrome-ui/notes-shell';
import Login from './routes/login';
import Signup from './routes/signup';
import { useAppSession } from '@nota/note-runtime/session-context';
import {
  NotesDataProvider,
  type NotesDataProviderPorts,
} from '@nota/note-runtime/notes-data-context';
import { SignedInCommandPalette } from './signed-in-command-palette';
import { useAppNavigationScreen } from '@nota/app-navigation-ui/use-app-navigation-screen';
import { ElectronWindowDragBand } from '@nota/electron-bridge-ui/window-drag-band';
import { NotFoundScreen } from './components/not-found-screen';
import {
  replaceAppHash,
  setAppHash,
  syncAppNavigation,
} from '@nota/app-navigation-core/navigation';
import { fetchNotaProEntitled } from './lib/nota-server-client';
import { runWelcomeNoteSeedIfNeeded } from './lib/welcome-note-seed';
import { clearNoteAttachmentSignedUrlCache } from '@nota/data-source/attachment-signed-url-cache';
import { repairClerkAuthLocationHash } from '@nota/app-navigation-core/clerk-hash';
import { NotaLoadingStatus } from '@nota/web-design/spinner';
import { useIsElectron } from '@nota/electron-bridge-ui/use-is-electron';
import { cn } from './lib/utils';

/**
 * App-owned collaborators for the notes-data runtime spine. Defined at module scope
 * so the ports object identity is stable across renders (see `NotesDataProviderPorts`).
 */
const notesDataPorts: NotesDataProviderPorts = {
  fetchNotaProEntitled,
  runWelcomeNoteSeedIfNeeded,
  navigateToNote: (noteId) => {
    setAppHash({ kind: 'notes', panel: 'note', noteId });
  },
  clearNoteAttachmentSignedUrlCache,
};

/**
 * App-owned lazy route components for `NotesShell`. The shell lives in `@nota/notes-chrome-ui`
 * and cannot import app-local route files directly, so they are injected as a prop (mirrors
 * `notesDataPorts` above). Defined at module scope so identity is stable across renders.
 */
const notesShellRoutes: NotesShellRouteComponents = {
  NotesGraphRoute: lazy(async () => import('./routes/notes.graph')),
  NotesJournalRoute: lazy(async () => import('./routes/notes.journal')),
  NotesSettingsRoute: lazy(async () => import('./routes/notes.settings')),
  NotesShortcutsRoute: lazy(async () => import('./routes/notes.shortcuts')),
};

function prefetchNotesShellRoutes(): void {
  // Vitest: prefetch completes after jsdom teardown and triggers EnvironmentTeardownError
  // on nested imports (e.g. notes.shortcuts → nota-kbd-styles). NotaApp is not rendered in
  // tests today, but guard anyway since this runs from module-scope app code.
  if (import.meta.env.MODE === 'test') {
    return;
  }
  void import('./routes/notes.settings');
  void import('./routes/notes.shortcuts');
  void import('./routes/notes.graph');
  void import('./routes/notes.journal');
}

interface AppShellProps {
  children: ReactNode;
  active: boolean;
  panelId: string;
}

function AppShellPanel({
  active,
  panelId,
  children,
}: AppShellProps): JSX.Element {
  return (
    <div
      id={panelId}
      className={cn(
        !active && 'hidden',
        active && 'flex min-h-0 flex-1 flex-col',
      )}
      aria-hidden={!active}
      inert={active ? undefined : true}
    >
      {children}
    </div>
  );
}

function redirectAuthShell(
  user: { id: string } | null,
  loading: boolean,
  kind: 'landing' | 'notFound' | 'login' | 'signup' | 'notes',
): void {
  if (loading) {
    return;
  }
  if (kind === 'notFound') {
    return;
  }
  if (user && kind === 'landing') {
    replaceAppHash({ kind: 'notes', panel: 'list', noteId: null });
    return;
  }
  if (!user && kind === 'notes') {
    replaceAppHash({ kind: 'login' });
    return;
  }
  if (user && (kind === 'login' || kind === 'signup')) {
    replaceAppHash({ kind: 'notes', panel: 'list', noteId: null });
  }
}

export function NotaApp(): JSX.Element {
  const { user, loading } = useAppSession();
  const screen = useAppNavigationScreen();
  const kind = screen.kind;
  const isElectron = useIsElectron();

  useLayoutEffect(() => {
    redirectAuthShell(user, loading, kind);
  }, [user, loading, kind]);

  useLayoutEffect(() => {
    if (kind === 'login' || kind === 'signup') {
      repairClerkAuthLocationHash();
    }
  }, [kind]);

  const landingActive = kind === 'landing';
  const notFoundActive = kind === 'notFound';
  const loginActive = kind === 'login';
  const signupActive = kind === 'signup';
  const notesActive = kind === 'notes';
  const anyShellActive =
    notFoundActive ||
    landingActive ||
    loginActive ||
    signupActive ||
    notesActive;

  /** Opaque root blocks Electron `vibrancy` + CSS glass; keep transparent only on the notes shell. */
  const appRootBackground =
    isElectron && notesActive ? 'bg-transparent' : 'bg-background';

  useEffect(() => {
    if (loading || anyShellActive) {
      return;
    }
    syncAppNavigation();
  }, [loading, anyShellActive]);

  if (loading) {
    return (
      <div className="relative flex h-dvh min-h-0 items-center justify-center bg-background text-muted-foreground text-sm">
        <ElectronWindowDragBand />
        <NotaLoadingStatus label="Loading…" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex h-dvh min-h-0 flex-col text-foreground',
        appRootBackground,
      )}
    >
      <ElectronWindowDragBand />
      {!anyShellActive ? (
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground"
          role="status"
        >
          <p>Reconnecting to this screen…</p>
          <button
            type="button"
            className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-foreground text-xs hover:bg-muted/60"
            onClick={() => {
              syncAppNavigation();
              if (user) {
                replaceAppHash({
                  kind: 'notes',
                  panel: 'list',
                  noteId: null,
                });
              } else {
                replaceAppHash({ kind: 'landing' });
              }
            }}
          >
            Open Nota
          </button>
        </div>
      ) : null}
      <AppShellPanel active={notFoundActive} panelId="screen-not-found">
        <NotFoundScreen signedIn={Boolean(user)} />
      </AppShellPanel>
      <AppShellPanel active={landingActive} panelId="screen-landing">
        {user ? (
          <div className="flex min-h-0 flex-1 h-dvh items-center justify-center bg-background text-muted-foreground text-sm">
            <NotaLoadingStatus label="Loading…" />
          </div>
        ) : (
          <LandingPage />
        )}
      </AppShellPanel>
      <AppShellPanel active={loginActive} panelId="screen-login">
        {loginActive && <Login />}
      </AppShellPanel>
      <AppShellPanel active={signupActive} panelId="screen-signup">
        {signupActive && <Signup />}
      </AppShellPanel>
      <AppShellPanel active={notesActive} panelId="screen-notes">
        <NotesDataProvider ports={notesDataPorts}>
          <SignedInCommandPalette />
          <NotesShell
            routes={notesShellRoutes}
            prefetchRoutes={prefetchNotesShellRoutes}
          />
        </NotesDataProvider>
      </AppShellPanel>
    </div>
  );
}
