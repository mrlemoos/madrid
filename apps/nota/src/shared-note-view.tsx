'use client';

import { Suspense, useEffect, useState, type JSX } from 'react';
import dynamic from 'next/dynamic';
import {
  noteSurfaceClassNames,
  parseNoteEditorSettings,
} from '@nota/note-editor-settings';
import { cn } from './lib/utils';
import { useNotaTranslator } from './lib/use-nota-translator';

import {
  fetchSharedNote,
  subscribeSharedNote,
  type SharedNote,
} from '@nota/data-source/note-share-client';

// Reuse the real editor in read-only mode so the preview matches the app
// exactly. `useEditor` throws when it detects a server render, so the body loads
// in the browser only and suspends behind a placeholder; everything around it
// (title, chrome, empty states) still renders on the server. Surface helpers come
// from `@nota/note-editor-settings` so TipTap stays out of the server graph.
const SharedNoteBody = dynamic(() => import('./shared-note-body'), {
  ssr: false,
});

type LoadState =
  | { status: 'ready'; note: SharedNote }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

export interface SharedNoteViewProps {
  /** Share token from the route; empty when the URL carried none. */
  token: string;
  /** Note as read on the server; `null` when the token matched nothing. */
  initialNote: SharedNote | null;
  /** Server-side load failure, surfaced instead of the note. */
  loadError: string | null;
}

function initialState({
  initialNote,
  loadError,
}: SharedNoteViewProps): LoadState {
  if (loadError) {
    return { status: 'error', message: loadError };
  }
  return initialNote
    ? { status: 'ready', note: initialNote }
    : { status: 'not-found' };
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

export function SharedNoteView(props: SharedNoteViewProps): JSX.Element {
  const { token } = props;
  const [state, setState] = useState<LoadState>(() => initialState(props));
  const { t } = useNotaTranslator();
  useSystemTheme();

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    // Live updates: DB trigger broadcasts on every edit -> refetch. The first
    // read already happened on the server, so nothing loads on mount.
    const unsubscribe = subscribeSharedNote(token, () => {
      void (async () => {
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
      })();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [token]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
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

        {state.status === 'ready' &&
          (() => {
            const { titleFontClass, bodyFontClass } = noteSurfaceClassNames(
              parseNoteEditorSettings(
                state.note.editorSettings as Parameters<
                  typeof parseNoteEditorSettings
                >[0],
              ),
            );
            return (
              <article className="space-y-6">
                <h1
                  className={cn(
                    'text-4xl font-extrabold leading-tight text-pretty md:text-5xl',
                    titleFontClass,
                  )}
                >
                  {state.note.title || t('Untitled Note')}
                </h1>
                <div className={bodyFontClass}>
                  <Suspense
                    fallback={
                      <div
                        className="h-40 w-full animate-pulse rounded-md bg-muted/40"
                        aria-hidden
                      />
                    }
                  >
                    <SharedNoteBody
                      content={state.note.content}
                      noteId={state.note.id}
                      contentRevision={state.note.updatedAt ?? undefined}
                    />
                  </Suspense>
                </div>
              </article>
            );
          })()}

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
