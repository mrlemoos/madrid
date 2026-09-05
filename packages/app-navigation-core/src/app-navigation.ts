/**
 * Screen <-> path mapping for the notes app, over real Next App Router paths
 * (`/notes`, `/notes/journal`, `/notes/note/<uuid>`, `/signin`, …). `pathForScreen`
 * builds the canonical path; `navigateToScreen`/`replaceScreen` navigate imperatively
 * via the Next router bridge (`setAppRouterNav`) — for callers that can't use hooks.
 * Reads come from `usePathname` (see `useAppNavigationScreen`).
 */

import {
  CLERK_SIGN_IN_PATH,
  CLERK_SIGN_UP_PATH,
  screenKindForAuthPathname,
} from './app-navigation-auth';
import {
  markNavIntent,
  type NavIntent,
} from '@getmadrid/nota-motion-ui/panel-motion';

/** Dispatched after patched `history.pushState` / `replaceState` (drives clerk-hash repair). */
export const NOTA_HASH_HISTORY_EVENT = 'nota:hash-history' as const;

export type AppNavOptions = {
  /**
   * Navigation input intent. Defaults to `keyboard` (instant panel swap).
   * Pass `pointer` for sidebar / footer clicks that should fade the main panel.
   */
  intent?: NavIntent;
};

export type NotesPanel =
  | 'list'
  | 'note'
  | 'graph'
  | 'journal'
  | 'settings'
  | 'shortcuts';

export type AppNavScreen =
  | { kind: 'landing' }
  | { kind: 'notFound' }
  | { kind: 'login' }
  | { kind: 'signup' }
  | {
      kind: 'notes';
      panel: NotesPanel;
      /** Set when panel is `note` */
      noteId: string | null;
    };

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const NOTE_PATH = new RegExp(`^/notes/note/(${UUID})/?$`, 'i');
const LEGACY_NOTE_PATH = new RegExp(`^/notes/(${UUID})/?$`, 'i');

/** Strip query, tolerate a leading `#` (legacy hash bookmarks), drop trailing slash. */
function normalisePath(input: string): string {
  const noHash = input.startsWith('#') ? input.slice(1) : input;
  const withoutQuery = noHash.split('?')[0] ?? '/';
  const withSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;
  return withSlash.replace(/\/$/, '') || '/';
}

/** Map a normalised app pathname to a screen. Auth is matched first (pathname routing). */
export function parseScreenFromPath(pathname: string): AppNavScreen {
  const path = normalisePath(pathname);

  const authKind = screenKindForAuthPathname(path);
  if (authKind === 'login') {
    return { kind: 'login' };
  }
  if (authKind === 'signup') {
    return { kind: 'signup' };
  }

  if (path === '/' || path === '') {
    return { kind: 'landing' };
  }
  if (path === '/404') {
    return { kind: 'notFound' };
  }

  if (path === '/notes') {
    return { kind: 'notes', panel: 'list', noteId: null };
  }
  if (path === '/notes/graph') {
    return { kind: 'notes', panel: 'graph', noteId: null };
  }
  if (path === '/notes/journal') {
    return { kind: 'notes', panel: 'journal', noteId: null };
  }
  if (path === '/notes/settings') {
    return { kind: 'notes', panel: 'settings', noteId: null };
  }
  if (path === '/notes/shortcuts') {
    return { kind: 'notes', panel: 'shortcuts', noteId: null };
  }

  const m = path.match(NOTE_PATH);
  if (m) {
    return { kind: 'notes', panel: 'note', noteId: m[1] };
  }
  const legacy = path.match(LEGACY_NOTE_PATH);
  if (legacy) {
    return { kind: 'notes', panel: 'note', noteId: legacy[1] };
  }

  return { kind: 'notFound' };
}

export function parseAppNavFromLocation(): AppNavScreen {
  return parseScreenFromPath(window.location.pathname);
}

/** Canonical app path for a screen (used as `<Link>`/`<a>` href and by the nav helpers). */
export function pathForScreen(screen: AppNavScreen): string {
  switch (screen.kind) {
    case 'landing':
      return '/';
    case 'notFound':
      return '/404';
    case 'login':
      return CLERK_SIGN_IN_PATH;
    case 'signup':
      return CLERK_SIGN_UP_PATH;
    case 'notes': {
      switch (screen.panel) {
        case 'list':
          return '/notes';
        case 'graph':
          return '/notes/graph';
        case 'journal':
          return '/notes/journal';
        case 'settings':
          return '/notes/settings';
        case 'shortcuts':
          return '/notes/shortcuts';
        case 'note':
          return screen.noteId ? `/notes/note/${screen.noteId}` : '/notes';
        default:
          return '/notes';
      }
    }
    default:
      return '/';
  }
}

/** Full URL for opening a note in a new tab. */
export function absoluteUrlForNote(noteId: string): string {
  return `${window.location.origin}/notes/note/${noteId}`;
}

export type AppRouterNav = {
  push: (href: string) => void;
  replace: (href: string) => void;
};

/**
 * Bridge to Next's App Router, injected by `<AppRouterNavBridge/>` on mount.
 * Imperative nav MUST go through it: a raw `history.pushState` to a different route
 * is only a *shallow* URL update in the App Router — it moves `usePathname` but never
 * renders the target segment, so the click appears dead. `router.push/replace` navigates.
 */
let appRouterNav: AppRouterNav | null = null;

export function setAppRouterNav(nav: AppRouterNav | null): void {
  appRouterNav = nav;
}

function writeAppNavUrl(screen: AppNavScreen, replace: boolean): void {
  const path = pathForScreen(screen);

  if (appRouterNav) {
    if (replace) {
      appRouterNav.replace(path);
    } else {
      appRouterNav.push(path);
    }
    return;
  }

  // Fallback before the bridge mounts (very first paint). Shallow, but better than nothing.
  const url = new URL(window.location.href);
  url.pathname = path;
  url.search = '';
  url.hash = '';
  if (replace) {
    window.history.replaceState(window.history.state, '', url.toString());
  } else {
    window.history.pushState(window.history.state, '', url.toString());
  }
}

export function navigateToScreen(
  screen: AppNavScreen,
  options?: AppNavOptions,
): void {
  markNavIntent(options?.intent ?? 'keyboard');
  // Auth screens replace (don't stack Clerk sub-steps in history); notes/landing push.
  if (screen.kind === 'login' || screen.kind === 'signup') {
    writeAppNavUrl(screen, true);
    return;
  }
  const target = pathForScreen(screen);
  if (normalisePath(window.location.pathname) === normalisePath(target)) {
    return;
  }
  writeAppNavUrl(screen, false);
}

export function replaceScreen(
  screen: AppNavScreen,
  options?: AppNavOptions,
): void {
  markNavIntent(options?.intent ?? 'keyboard');
  writeAppNavUrl(screen, true);
}

/**
 * Navigate to an app path string, canonicalising legacy forms (`/notes/<uuid>` ->
 * `/notes/note/<uuid>`). For code that navigates by path, not by screen object.
 */
export function navigateFromLegacyPath(
  to: string,
  options?: AppNavOptions,
): void {
  navigateToScreen(parseScreenFromPath(to), options);
}

/**
 * Patches `pushState` / `replaceState` once so they emit `NOTA_HASH_HISTORY_EVENT`.
 * Reactivity for `useAppNavigationScreen` comes from Next's `usePathname`; the only
 * remaining consumer of this patch is clerk-hash repair, which sanitizes poisoned
 * `#/…` auth fragments after a programmatic URL change (Clerk assigns them directly).
 */
export function bootstrapAppNavigation(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const patchKey = '__notaHistoryNavigationPatched';
  if (
    !(patchKey in window) ||
    !(window as unknown as Record<string, boolean>)[patchKey]
  ) {
    (window as unknown as Record<string, boolean>)[patchKey] = true;
    const patchHistoryNavigation = (
      key: 'pushState' | 'replaceState',
    ): void => {
      const { history } = window;
      const original = history[key].bind(history) as (
        data: unknown,
        unused: string,
        url?: string | URL | null,
      ) => void;
      history[key] = function (
        this: History,
        data: unknown,
        unused: string,
        url?: string | URL | null,
      ) {
        original(data, unused, url);
        window.dispatchEvent(new Event(NOTA_HASH_HISTORY_EVENT));
      } as History[typeof key];
    };
    patchHistoryNavigation('pushState');
    patchHistoryNavigation('replaceState');
  }
}
