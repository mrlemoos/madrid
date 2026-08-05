import { lazy, Suspense, type JSX } from 'react';
import type { Note } from '@nota/database-types';
import type { PlaceholderValues } from '@nota/i18n';
import { NotaLoadingStatus } from '@nota/design/spinner';

const NotesGraphViewLazy = lazy(async () => {
  const { NotesGraphView } = await import('./notes-graph-view');
  return { default: NotesGraphView };
});

export type NotesGraphScreenProps = {
  notes: readonly Note[];
  onOpenNote: (noteId: string) => void;
  t: (key: string, values?: PlaceholderValues) => string;
};

export function NotesGraphScreen({
  notes,
  onOpenNote,
  t,
}: NotesGraphScreenProps): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col gap-4">
        <div>
          <h1 className="font-serif text-xl font-semibold tracking-normal text-foreground">
            {t('Note Graph')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'How your notes link together. Click a note to open it. Pan and zoom to explore.',
            )}
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
              <NotaLoadingStatus label={t('Loading graph…')} />
            </div>
          }
        >
          <NotesGraphViewLazy notes={notes} onOpenNote={onOpenNote} t={t} />
        </Suspense>
      </div>
    </div>
  );
}
