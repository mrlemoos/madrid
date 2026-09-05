import type { CSSProperties, JSX, ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@getmadrid/design/button';
import { Icon } from '@getmadrid/design/icon';
import { cn } from '@getmadrid/design/utils';
import { replaceScreen } from '@getmadrid/app-navigation-core/navigation';
import {
  consumeNavIntent,
  markNavIntent,
  resolvePanelMotion,
  type NavIntent,
} from '@getmadrid/nota-motion-ui/panel-motion';
import {
  NOTA_PRESSABLE_CLASS,
  NOTA_CHROME_NAV_ITEM_CLASS,
} from '@getmadrid/nota-motion-ui/interaction';
import { ELECTRON_WINDOW_NO_DRAG_CLASS } from '@getmadrid/electron-bridge-core/window-chrome';
import { NOTA_SIDEBAR_HOVER_EDGE_WIDTH_PX } from '@getmadrid/nota-motion-ui/motion';
import { notesSidebarChrome } from '@getmadrid/notes-chrome-core/notes-chrome';
import {
  NOTA_CHROME_CONTROL_COMPACT_CLASS,
  NOTA_SECTION_HEAD_CLASS,
  NOTA_TRACKING_CHROME_XS_CLASS,
} from '@getmadrid/notes-chrome-core/chrome-type';
import { useNotesChromeTranslator } from './use-notes-chrome-translator';
import { useIsElectron } from '@getmadrid/electron-bridge-ui/use-is-electron';
import { useNotesSidebarStore } from '@getmadrid/note-runtime/stores/sidebar';
import { useNotaPreferencesStore } from '@getmadrid/note-runtime/stores/preferences';
import {
  buildActivityGridCells,
  computeCurrentStreak,
  computeLongestStreak,
  ACTIVITY_LEVEL_CLASSES,
} from '@getmadrid/writing-activity-core/writing-activity';
import {
  Tooltip,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from '@getmadrid/design/tooltip';

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
    <TooltipProvider delay={250}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
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
                <Icon name="arrow-narrow-left" size={20} strokeWidth={1.5} />
              ) : (
                <Icon name="arrow-narrow-right" size={20} strokeWidth={1.5} />
              )}
            </Button>
          }
        />
        <TooltipPortal>
          <TooltipPositioner side="right" sideOffset={6}>
            <TooltipPopup>{label}</TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}

/** One sidebar navigation destination. */
export type ChromeNavItem = {
  key: string;
  href: string;
  label: string;
  active: boolean;
};

export function ChromeNavLinks({
  items,
}: {
  items: ChromeNavItem[];
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3" data-slot="chrome-nav">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          data-slot="chrome-nav-item"
          onClick={() => {
            markNavIntent('pointer');
          }}
          className={cn(
            NOTA_CHROME_NAV_ITEM_CLASS,
            NOTA_PRESSABLE_CLASS,
            'flex items-center rounded-md px-3 py-2 text-sm',
            item.active
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Hover-leave delay (ms). Covers the edge → rail pointer gap (`--duration-micro`). */
export const NOTA_COLLAPSED_SIDEBAR_PEEK_LEAVE_MS = 80;

/**
 * Collapsed sidebar: navigation revealed on hover. Hidden until the pointer hits the
 * left-edge target, then panel-reveals (slide + fade + cross-blur).
 */
export function SidebarIconRail({
  items,
}: {
  items: ChromeNavItem[];
}): JSX.Element {
  const isElectron = useIsElectron();
  const [pointerOver, setPointerOver] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLeave = () => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const peekOpen = pointerOver;
  const peekHandlers = {
    onPointerEnter: () => {
      cancelLeave();
      setPointerOver(true);
    },
    onPointerLeave: () => {
      cancelLeave();
      leaveTimerRef.current = setTimeout(() => {
        leaveTimerRef.current = null;
        setPointerOver(false);
      }, NOTA_COLLAPSED_SIDEBAR_PEEK_LEAVE_MS);
    },
  };

  return (
    <div
      data-slot="collapsed-sidebar-peek"
      className="pointer-events-none absolute inset-y-0 left-0 z-40"
      style={
        {
          '--panel-open-dur': '180ms',
          '--panel-close-dur': '150ms',
          '--panel-translate-y': '12px',
        } as CSSProperties
      }
    >
      <div
        data-slot="sidebar-hover-edge"
        aria-hidden
        {...peekHandlers}
        style={{ width: NOTA_SIDEBAR_HOVER_EDGE_WIDTH_PX }}
        className={cn(
          'pointer-events-auto absolute bottom-0 left-0',
          isElectron
            ? cn(
                'top-[max(3.25rem,calc(env(safe-area-inset-top)+2.5rem))]',
                ELECTRON_WINDOW_NO_DRAG_CLASS,
              )
            : 'top-0',
        )}
      />
      <div
        data-slot="sidebar-icon-rail"
        data-axis="x"
        data-open={peekOpen ? 'true' : 'false'}
        aria-hidden={!peekOpen}
        inert={!peekOpen ? true : undefined}
        {...peekHandlers}
        className={cn(
          't-panel-slide absolute inset-y-0 left-0 flex w-max flex-col items-start whitespace-nowrap px-3 pb-3',
          notesSidebarChrome,
          isElectron
            ? cn(
                'pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.5rem))]',
                ELECTRON_WINDOW_NO_DRAG_CLASS,
              )
            : 'pt-4',
        )}
      >
        <SidebarToggle />
        <div className="mt-auto pt-4">
          <ChromeNavLinks items={items} />
        </div>
      </div>
    </div>
  );
}

export function ChromePanel({
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
        <Button
          type="button"
          size="lg"
          className="min-h-10 px-6"
          onClick={onCreate}
        >
          {t('Create New Note')}
        </Button>
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
                replaceScreen(
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
              <Tooltip key={cell.dateKey}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-[1px]',
                        ACTIVITY_LEVEL_CLASSES[color][cell.level],
                      )}
                    />
                  }
                />
                <TooltipPortal>
                  <TooltipPositioner side="top" sideOffset={4}>
                    <TooltipPopup>
                      {cell.count} on{' '}
                      {cell.date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TooltipPopup>
                  </TooltipPositioner>
                </TooltipPortal>
              </Tooltip>
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
