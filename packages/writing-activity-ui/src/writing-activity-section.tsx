import { useMemo, type JSX } from 'react';
import { cn } from '@/lib/utils';
import {
  buildActivityGridCells,
  countActiveDaysLast365,
  computeCurrentStreak,
  computeLongestStreak,
  ACTIVITY_LEVEL_CLASSES,
  type ActivityLevel,
  type WritingActivityColor,
} from '@/lib/writing-activity';
import { useNotaPreferencesStore } from '../stores/nota-preferences';
import { submitUserPreferencesPatch } from '@/lib/use-sync-user-preferences';
import {
  useNotesDataActions,
  useNotesDataMeta,
} from '@/context/notes-data-context';
import { useRootLoaderData } from '@/context/session-context';
import { useNotaTranslator } from '@/lib/use-nota-translator';
import {
  NotaTooltip,
  NotaTooltipPopup,
  NotaTooltipPortal,
  NotaTooltipPositioner,
  NotaTooltipTrigger,
} from '@nota/web-design/tooltip';

const COLOR_FAMILIES: WritingActivityColor[] = ['blue', 'red', 'pink', 'rose'];

export function WritingActivitySection(): JSX.Element {
  const { t } = useNotaTranslator();
  const { notaProEntitled } = useNotesDataMeta();
  const show = useNotaPreferencesStore((s) => s.showWritingActivityGraph);
  const color = useNotaPreferencesStore((s) => s.writingActivityColor);
  const days = useNotaPreferencesStore((s) => s.writingActivityDays);
  const setShow = useNotaPreferencesStore((s) => s.setShowWritingActivityGraph);
  const setColor = useNotaPreferencesStore((s) => s.setWritingActivityColor);
  const { setUserPreferencesInState } = useNotesDataActions();
  const { user } = useRootLoaderData();

  const cells = useMemo(() => buildActivityGridCells(days), [days]);
  const currentStreak = useMemo(() => computeCurrentStreak(days), [days]);
  const longestStreak = useMemo(() => computeLongestStreak(days), [days]);
  const activeDays = useMemo(() => countActiveDaysLast365(days), [days]);

  if (!notaProEntitled) return null;

  const handleShowChange = (checked: boolean) => {
    setShow(checked);
    submitUserPreferencesPatch(
      { show_writing_activity_graph: checked },
      user?.id,
      setUserPreferencesInState,
      true,
    );
  };

  const handleColorChange = (c: WritingActivityColor) => {
    setColor(c);
    submitUserPreferencesPatch(
      { writing_activity_color: c },
      user?.id,
      setUserPreferencesInState,
      true,
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">
          {t('Writing activity')}
        </h2>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => {
              handleShowChange(e.target.checked);
            }}
            className="size-3.5 accent-primary"
          />
          {t('Show')}
        </label>
      </div>

      {show && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-sm">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-muted-foreground">
            <div>
              {t('Current streak')}:{' '}
              <span className="font-medium text-foreground">
                {currentStreak}
              </span>
            </div>
            <div>
              {t('Longest streak')}:{' '}
              <span className="font-medium text-foreground">
                {longestStreak}
              </span>
            </div>
            <div>
              {activeDays} {t('active days (last year)')}
            </div>
          </div>

          {/* Compact GitHub-style: 7 rows (days), many columns (weeks). Keeps height small. */}
          <div className="grid auto-cols-[10px] grid-flow-col grid-rows-7 gap-[2px] overflow-x-auto pb-1">
            {cells.map((cell) => (
              <NotaTooltip key={cell.dateKey}>
                <NotaTooltipTrigger asChild>
                  <div
                    className={cn(
                      'h-[10px] w-[10px] rounded-[2px]',
                      ACTIVITY_LEVEL_CLASSES[color][cell.level],
                    )}
                    aria-label={`${String(cell.count)} contributions on ${cell.date.toLocaleDateString()}`}
                  />
                </NotaTooltipTrigger>
                <NotaTooltipPortal>
                  <NotaTooltipPositioner side="top" sideOffset={4}>
                    <NotaTooltipPopup>
                      {t('{count} contributions on {date}', {
                        count: cell.count,
                        date: cell.date.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        }),
                      })}
                    </NotaTooltipPopup>
                  </NotaTooltipPositioner>
                </NotaTooltipPortal>
              </NotaTooltip>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>{t('Less')}</span>
              {[0, 1, 2, 3, 4].map((lv) => (
                <div
                  key={lv}
                  className={cn(
                    'size-2.5 rounded-sm',
                    ACTIVITY_LEVEL_CLASSES[color][lv as ActivityLevel],
                  )}
                />
              ))}
              <span>{t('More')}</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              {COLOR_FAMILIES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    handleColorChange(c);
                  }}
                  className={cn(
                    'rounded px-1.5 py-0.5 capitalize',
                    color === c && 'bg-muted text-foreground',
                  )}
                >
                  {t(c.charAt(0).toUpperCase() + c.slice(1))}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
