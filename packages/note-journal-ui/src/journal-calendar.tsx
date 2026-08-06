import { useMemo, type JSX } from 'react';
import { Button } from '@nota/design/button';
import { cn } from '@nota/design/utils';
import {
  buildJournalCalendarCells,
  type JournalCalendarCell,
} from '@nota/note-journal-core/calendar';
import { useJournalMonthGridCrossfade } from '@nota/note-journal-core/month-grid-transition';
import { localDateKey } from '@nota/note-journal-core/local-date-key';
import { usePrefersReducedMotion } from '@nota/nota-motion-ui/use-prefers-reduced-motion';
import { useJournalTranslator } from './use-journal-translator';

const WEEKDAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const navButtonClass = cn(
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground',
  'transition-colors hover:bg-muted/60 hover:text-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

export function JournalCalendar({
  year,
  month,
  dateKeysWithNotes,
  selectedDateKey,
  onSelectDateKey,
  onMonthChange,
  onJumpToToday,
}: {
  year: number;
  month: number;
  dateKeysWithNotes: ReadonlySet<string>;
  selectedDateKey: string | null;
  onSelectDateKey: (dateKey: string | null) => void;
  onMonthChange: (year: number, month: number) => void;
  onJumpToToday: () => void;
}): JSX.Element {
  const { t } = useJournalTranslator();
  const cells = useMemo(
    () => buildJournalCalendarCells(year, month),
    [month, year],
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const { outgoingLayer, incomingLayer, phase } = useJournalMonthGridCrossfade(
    year,
    month,
    cells,
    prefersReducedMotion,
  );

  const monthLabel = useMemo(() => {
    return new Date(year, month, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [month, year]);

  const todayKey = useMemo(() => localDateKey(new Date()), []);

  const isViewingCurrentMonth = useMemo(() => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
  }, [month, year]);

  const goMonth = (delta: number): void => {
    const next = new Date(year, month + delta, 1);
    onMonthChange(next.getFullYear(), next.getMonth());
  };

  const gridLayerClass = cn(
    'grid grid-cols-7 gap-1',
    phase === 'crossfade' && 'motion-reduce:transition-none',
  );
  const gridLayerStyle =
    phase === 'crossfade'
      ? {
          transitionProperty: 'opacity',
          transitionDuration: '150ms',
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        }
      : undefined;

  const renderMonthCells = (
    monthCells: readonly JournalCalendarCell[],
  ): JSX.Element[] => {
    return monthCells.map((cell) => {
      const hasNote = dateKeysWithNotes.has(cell.dateKey);
      const isSelected = selectedDateKey === cell.dateKey;
      const isToday = cell.dateKey === todayKey;
      const day = cell.date.getDate();

      return (
        <button
          key={cell.dateKey}
          type="button"
          role="gridcell"
          aria-selected={isSelected}
          disabled={!cell.inMonth}
          onClick={() => {
            if (!cell.inMonth) {
              return;
            }
            onSelectDateKey(isSelected ? null : cell.dateKey);
          }}
          className={cn(
            'relative flex min-h-[2.75rem] flex-col items-center justify-center rounded-lg px-0.5 py-1 text-sm transition-colors',
            cell.inMonth
              ? 'text-foreground hover:bg-muted/50'
              : 'pointer-events-none text-transparent',
            isSelected && cell.inMonth && 'bg-muted/80 ring-1 ring-border/80',
            isToday && cell.inMonth && !isSelected && 'ring-1 ring-primary/40',
          )}
        >
          <span
            className={cn(
              'tabular-nums',
              !cell.inMonth && 'opacity-0',
              isToday && cell.inMonth && 'font-semibold text-primary',
            )}
          >
            {day}
          </span>
          {hasNote && cell.inMonth ? (
            <span
              className={cn(
                'mt-0.5 h-1 w-1 shrink-0 rounded-full',
                'bg-foreground shadow-[0_0_4px_rgba(0,0,0,0.2)]',
                'dark:bg-white dark:shadow-[0_0_6px_rgba(255,255,255,0.45)]',
              )}
              aria-hidden
            />
          ) : (
            <span className="mt-0.5 h-1 w-1 shrink-0" aria-hidden />
          )}
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold tracking-normal text-foreground">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              goMonth(-1);
            }}
            className={navButtonClass}
            aria-label={t('Previous month')}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => {
              goMonth(1);
            }}
            className={navButtonClass}
            aria-label={t('Next month')}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {!isViewingCurrentMonth ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs font-medium"
          onClick={onJumpToToday}
        >
          {t('Go to today')}
        </Button>
      ) : null}

      <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_KEYS.map((key) => (
          <span key={key} className="py-1">
            {t(key)}
          </span>
        ))}
      </div>

      <div className="relative min-h-[17.75rem]">
        {outgoingLayer ? (
          <div
            className={cn(gridLayerClass, 'absolute inset-0')}
            style={{
              ...gridLayerStyle,
              opacity: outgoingLayer.opacity,
              filter: outgoingLayer.blur ? 'blur(2px)' : undefined,
            }}
            role="presentation"
          >
            {renderMonthCells(outgoingLayer.cells)}
          </div>
        ) : null}
        <div
          className={gridLayerClass}
          style={{ ...gridLayerStyle, opacity: incomingLayer.opacity }}
          role="grid"
          aria-label={t('Journal calendar')}
        >
          {renderMonthCells(incomingLayer.cells)}
        </div>
      </div>
    </div>
  );
}

function ChevronLeft(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRight(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}
