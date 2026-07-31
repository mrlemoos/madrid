import { lazy, Suspense, useEffect, useState, type JSX } from 'react';

import {
  fetchSharedNote,
  subscribeSharedNote,
  SHARED_NOTE_PATH_PREFIX,
  type SharedNote,
} from './lib/note-share-client';

// Reuse the real editor in read-only mode so the preview matches the app
// exactly. Lazy so the heavy editor bundle doesn't block first paint.
const TipTapEditor = lazy(() =>
  import('@nota/editor').then((m) => ({ default: m.TipTapEditor })),
);

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; note: SharedNote }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

function tokenFromPath(): string {
  const path = window.location.pathname;
  if (!path.startsWith(SHARED_NOTE_PATH_PREFIX)) {
    return '';
  }
  return decodeURIComponent(path.slice(SHARED_NOTE_PATH_PREFIX.length)).replace(
    /\/+$/,
    '',
  );
}

/** Follow the OS colour scheme on this standalone page (no ThemeProvider here). */
function useSystemTheme(): void {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.classList.toggle('dark', media.matches);
    };
    apply();
    media.addEventListener('change', apply);
    return () => {
      media.removeEventListener('change', apply);
    };
  }, []);
}

export function SharedNoteView(): JSX.Element {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  useSystemTheme();

  useEffect(() => {
    const token = tokenFromPath();
    if (!token) {
      setState({ status: 'not-found' });
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const note = await fetchSharedNote(token);
        if (!active) return;
        setState(note ? { status: 'ready', note } : { status: 'not-found' });
      } catch (error) {
        if (!active) return;
        setState({
          status: 'error',
          message:
            error instanceof Error ? error.message : 'Something went wrong',
        });
      }
    };

    void load();
    // Live updates: DB trigger broadcasts on every edit -> refetch.
    const unsubscribe = subscribeSharedNote(token, () => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
        {state.status === 'loading' && (
          <p className="text-muted-foreground">Loading…</p>
        )}

        {state.status === 'not-found' && (
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold">Note not found</h1>
            <p className="text-muted-foreground">
              This shared link is invalid or is no longer available.
            </p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold">Couldn’t load this note</h1>
            <p className="text-muted-foreground">{state.message}</p>
          </div>
        )}

        {state.status === 'ready' && (
          <article className="space-y-6">
            <h1 className="text-4xl font-extrabold leading-tight text-pretty md:text-5xl">
              {state.note.title || 'Untitled'}
            </h1>
            <Suspense
              fallback={<p className="text-muted-foreground">Loading…</p>}
            >
              <TipTapEditor
                readOnly
                content={state.note.content}
                noteId={state.note.id}
                contentRevision={state.note.updatedAt ?? undefined}
                placeholder=""
              />
            </Suspense>
          </article>
        )}

        <footer className="mt-16 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          Shared with{' '}
          <a
            href="https://nota.mrlemoos.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            Nota
          </a>
        </footer>
      </main>
    </div>
  );
}
