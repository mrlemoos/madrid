import { useCallback, useMemo, useState, type JSX } from 'react';
import { cn } from '@/lib/utils';
import {
  buildJournalEntriesFromNotes,
  filterJournalEntriesByDateKey,
  journalDateKeysFromEntries,
} from '@/lib/journal-notes';
import { navigateFromLegacyPath } from '@/lib/app-navigation';
import { useNotesDataVault } from '@/context/notes-data-context';
import { useNotaTranslator } from '@/lib/use-nota-translator';
import { parseDateKey } from '@/lib/journal-calendar';
import { localDateKey } from '@/lib/todays-note';
import { JournalCalendar } from './journal-calendar';
import { JournalNotesList } from './journal-notes-list';

function initialVisibleMonth(
  entries: ReturnType<typeof buildJournalEntriesFromNotes>,
): { year: number; month: number } {
  const anchor = entries[0]?.date ?? new Date();
  return { year: anchor.getFullYear(), month: anchor.getMonth() };
}

export function JournalScreen(): JSX.Element {
  const { notes } = useNotesDataVault();
  const { t } = useNotaTranslator();
  const entries = useMemo(() => buildJournalEntriesFromNotes(notes), [notes]);
  const dateKeysWithNotes = useMemo(
    () => journalDateKeysFromEntries(entries),
    [entries],
  );

  const [visibleMonth, setVisibleMonth] = useState(() =>
    initialVisibleMonth(entries),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const filteredEntries = useMemo(
    () => filterJournalEntriesByDateKey(entries, selectedDateKey),
    [entries, selectedDateKey],
  );

  const jumpToToday = useCallback(() => {
    const now = new Date();
    setVisibleMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDateKey(localDateKey(now));
  }, []);

  const listHeading = selectedDateKey
    ? (() => {
        const { year, month, day } = parseDateKey(selectedDateKey);
        return new Date(year, month - 1, day);
      })().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : t('All entries');

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-4 sm:py-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-4 sm:gap-6">
        <header className="shrink-0">
          <h1 className="font-serif text-2xl font-semibold tracking-normal text-foreground">
            {t('Journal')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-pretty text-muted-foreground">
            {t(
              'Notes titled with a date, browse by calendar or scroll the timeline.',
            )}
          </p>
        </header>

        <div
          className={cn(
            'grid min-h-0 flex-1 gap-6 overflow-hidden',
            'grid-rows-[minmax(0,min(40dvh,26rem))_minmax(0,1fr)]',
            'lg:grid-rows-1 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-8',
          )}
        >
          <section
            className={cn(
              'flex min-h-0 flex-col overflow-y-auto overflow-x-hidden',
              'rounded-xl border border-border/60 bg-muted/15 p-4',
              'backdrop-blur-md dark:bg-black/20',
            )}
            aria-label={t('Journal calendar')}
          >
            <JournalCalendar
              year={visibleMonth.year}
              month={visibleMonth.month}
              dateKeysWithNotes={dateKeysWithNotes}
              selectedDateKey={selectedDateKey}
              onSelectDateKey={setSelectedDateKey}
              onMonthChange={(year, month) => {
                setVisibleMonth({ year, month });
              }}
              onJumpToToday={jumpToToday}
            />
          </section>

          <section
            className={cn(
              'flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60',
              'bg-background/40 p-4 backdrop-blur-md dark:bg-background/25',
            )}
            aria-label={t('Journal entries')}
          >
            <div className="mb-3 flex shrink-0 items-baseline justify-between gap-2 border-b border-border/40 pb-3">
              <h2 className="font-serif text-lg font-semibold tracking-normal text-foreground">
                {listHeading}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {t('{count} notes', { count: filteredEntries.length })}
              </span>
            </div>
            <JournalNotesList
              entries={filteredEntries}
              onOpenNote={(id) => {
                navigateFromLegacyPath(`/notes/${id}`);
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
