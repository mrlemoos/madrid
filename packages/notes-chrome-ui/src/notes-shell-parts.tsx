import type { JSX, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { NotaButton } from '@nota/web-design/button';
import { NotaIcon } from '@nota/web-design/icon';
import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
} from '@nota/web-design/icons';
import { NotaLoadingStatus } from '@nota/web-design/spinner';
import { cn } from '@nota/web-design/utils';
import { replaceAppHash } from '@nota/app-navigation-core/navigation';
import {
  consumeNavIntent,
  resolvePanelMotion,
  type NavIntent,
} from '@nota/nota-motion-ui/panel-motion';
import { ELECTRON_WINDOW_NO_DRAG_CLASS } from '@nota/electron-bridge-core/window-chrome';
import {
  NOTA_CHROME_CONTROL_COMPACT_CLASS,
  NOTA_SECTION_HEAD_CLASS,
  NOTA_TRACKING_CHROME_XS_CLASS,
} from '@nota/notes-chrome-core/chrome-type';
import { useNotesChromeTranslator } from './use-notes-chrome-translator';
import { useIsElectron } from '@nota/electron-bridge-ui/use-is-electron';
import { useNotesSidebarStore } from '@nota/note-runtime/stores/sidebar';
import { useNotaPreferencesStore } from '@nota/note-runtime/stores/preferences';
import {
  buildActivityGridCells,
  computeCurrentStreak,
  computeLongestStreak,
  ACTIVITY_LEVEL_CLASSES,
} from '@nota/writing-activity-core/writing-activity';
import {
  NotaTooltip,
  NotaTooltipPortal,
  NotaTooltipPositioner,
  NotaTooltipPopup,
  NotaTooltipProvider,
  NotaTooltipTrigger,
} from '@nota/web-design/tooltip';

/** Avoid `fallback={null}`: paywall redirect hits Settings before the chunk loads; Electron notes root is transparent so an empty main reads as a blank screen. */
export function LazyNotesRouteFallback({
  label,
}: {
  label: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center px-4',
        'bg-background/80 text-sm text-muted-foreground',
      )}
    >
      <NotaLoadingStatus label={label} />
    </div>
  );
}

export function SidebarToggle({
  className,
}: {
  className?: string;
}): JSX.Element {
  const { open, toggle } = useNotesSidebarStore();
  const { t } = useNotesChromeTranslator();
  const isElectron = useIsElectron();
  const label = open ? t('Close sidebar') : t('Open sidebar');

  return (
    <NotaTooltipProvider delay={250}>
      <NotaTooltip>
        <NotaTooltipTrigger
          render={
            <NotaButton
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggle}
              className={cn(
                'relative z-40 text-foreground',
                NOTA_CHROME_CONTROL_COMPACT_CLASS,
                isElectron && ELECTRON_WINDOW_NO_DRAG_CLASS,
                className,
              )}
              aria-label={label}
              aria-expanded={open}
            >
              {open ? (
                <NotaIcon
                  icon={ArrowNarrowLeftIcon}
                  size={20}
                  strokeWidth={1.5}
                />
              ) : (
                <NotaIcon
                  icon={ArrowNarrowRightIcon}
                  size={20}
                  strokeWidth={1.5}
                />
              )}
            </NotaButton>
          }
        />
        <NotaTooltipPortal>
          <NotaTooltipPositioner side="bottom" sideOffset={6}>
            <NotaTooltipPopup>{label}</NotaTooltipPopup>
          </NotaTooltipPositioner>
        </NotaTooltipPortal>
      </NotaTooltip>
    </NotaTooltipProvider>
  );
}

export function ShellPanel({
  active,
  panelId,
  children,
}: {
  active: boolean;
  panelId: string;
  children: ReactNode;
}): JSX.Element {
  const wasActiveRef = useRef(active);
  const [enterIntent, setEnterIntent] = useState<NavIntent | null>(null);
  const [enterClassName, setEnterClassName] = useState('');

  useLayoutEffect(() => {
    const wasActive = wasActiveRef.current;
    if (active && !wasActive) {
      const intent = consumeNavIntent();
      const motion = resolvePanelMotion(intent);
      setEnterIntent(intent);
      setEnterClassName(motion.className);
    } else if (!active) {
      setEnterIntent(null);
      setEnterClassName('');
    }
    wasActiveRef.current = active;
  }, [active]);

  return (
    <div
      id={panelId}
      data-nav-intent={enterIntent ?? undefined}
      className={cn(
        'h-full min-h-0',
        !active && 'hidden',
        active && enterClassName,
      )}
      aria-hidden={!active}
      inert={!active ? true : undefined}
    >
      {children}
    </div>
  );
}

export function NotesIndexPanel({
  onCreate,
}: {
  onCreate: () => void;
}): JSX.Element {
  const { t } = useNotesChromeTranslator();
  const showGraph = useNotaPreferencesStore((s) => s.showWritingActivityGraph);
  const color = useNotaPreferencesStore((s) => s.writingActivityColor);
  const days = useNotaPreferencesStore((s) => s.writingActivityDays);

  // Show a more compact recent window in the empty state (last ~20 weeks)
  const allCells = buildActivityGridCells(days);
  const cells = allCells.slice(-140);
  const current = computeCurrentStreak(days);
  const longest = computeLongestStreak(days);

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="h-16 w-16 text-muted-foreground"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h2
          className={cn(
            'mb-2 text-xl text-foreground',
            NOTA_SECTION_HEAD_CLASS,
          )}
        >
          {t('Select a note')}
        </h2>
        <p className="mb-6 text-muted-foreground">
          {t('Choose a note from the sidebar or create a new one.')}
        </p>
        <NotaButton
          type="button"
          size="lg"
          className="min-h-10 px-6"
          onClick={onCreate}
        >
          {t('Create New Note')}
        </NotaButton>
      </div>

      {showGraph && (
        <div className="mt-10 w-full max-w-155 px-2">
          <div
            className={cn(
              'mb-2 flex items-baseline justify-between text-xs text-muted-foreground',
              NOTA_TRACKING_CHROME_XS_CLASS,
            )}
          >
            <div>
              Current streak:{' '}
              <span className="font-medium text-foreground">{current}</span>
              <span className="ml-3">
                Longest:{' '}
                <span className="font-medium text-foreground">{longest}</span>
              </span>
            </div>
            <button
              onClick={() => {
                replaceAppHash(
                  {
                    kind: 'notes',
                    panel: 'settings',
                    noteId: null,
                  },
                  { intent: 'pointer' },
                );
              }}
              className="underline decoration-border underline-offset-2 hover:decoration-foreground"
            >
              {t('Settings')}
            </button>
          </div>

          <div className="grid auto-cols-[10px] grid-flow-col grid-rows-7 gap-0.5 overflow-x-auto rounded bg-border/30 p-2">
            {cells.map((cell) => (
              <NotaTooltip key={cell.dateKey}>
                <NotaTooltipTrigger
                  render={
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-[1px]',
                        ACTIVITY_LEVEL_CLASSES[color][cell.level],
                      )}
                    />
                  }
                />
                <NotaTooltipPortal>
                  <NotaTooltipPositioner side="top" sideOffset={4}>
                    <NotaTooltipPopup>
                      {cell.count} on{' '}
                      {cell.date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </NotaTooltipPopup>
                  </NotaTooltipPositioner>
                </NotaTooltipPortal>
              </NotaTooltip>
            ))}
          </div>

          {cells.every((c) => c.count === 0) ? (
            <div className="mt-1 text-[10px] text-muted-foreground text-center">
              Start writing to light up your activity graph.
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Your writing activity
            </div>
          )}
        </div>
      )}
    </div>
  );
}
