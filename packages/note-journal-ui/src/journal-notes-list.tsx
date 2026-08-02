import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, type JSX } from 'react';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/lib/journal-notes';
import { useNotaTranslator } from '@/lib/use-nota-translator';

/** Initial row height before `measureElement` runs (title-only vs title + preview). */
function estimateJournalRowHeight(entry: JournalEntry | undefined): number {
  if (!entry) {
    return 32;
  }
  return entry.bodyPreview ? 36 : 24;
}

export function JournalNotesList({
  entries,
  onOpenNote,
}: {
  entries: readonly JournalEntry[];
  onOpenNote: (noteId: string) => void;
}): JSX.Element {
  const { t } = useNotaTranslator();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => estimateJournalRowHeight(entries[index]),
    getItemKey: (index) => entries[index]?.noteId ?? index,
    overscan: 8,
  });

  if (entries.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-muted-foreground">
        {t('No journal entries for this day.')}
      </p>
    );
  }

  return (
    <div
      ref={parentRef}
      className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]"
    >
      <div
        className="relative w-full"
        style={{ height: `${String(virtualizer.getTotalSize())}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = entries.at(virtualRow.index);
          if (entry === undefined) {
            return null;
          }

          return (
            <div
              key={entry.noteId}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${String(virtualRow.start)}px)`,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onOpenNote(entry.noteId);
                }}
                className={cn(
                  'flex w-full flex-col items-start gap-0 rounded-md px-2 py-1 text-left',
                  'transition-colors hover:bg-muted/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <span className="line-clamp-1 text-sm font-medium leading-snug text-foreground">
                  {entry.title}
                </span>
                {entry.bodyPreview ? (
                  <span className="line-clamp-1 w-full text-xs leading-snug text-pretty text-muted-foreground">
                    {entry.bodyPreview}
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
