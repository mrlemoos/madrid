import { useEffect, useReducer, useRef } from 'react';
import type { JournalCalendarCell } from './journal-calendar';

export const JOURNAL_MONTH_GRID_CROSSFADE_MS = 150;

export type JournalMonthGridLayer = {
  year: number;
  month: number;
  cells: readonly JournalCalendarCell[];
};

export type JournalMonthGridRenderLayer = JournalMonthGridLayer & {
  opacity: number;
  blur?: boolean;
};

export type JournalMonthGridCrossfadePhase = 'static' | 'crossfade';

type JournalMonthGridCrossfadeState = {
  incoming: JournalMonthGridLayer;
  outgoing: JournalMonthGridLayer | null;
  phase: JournalMonthGridCrossfadePhase;
  outgoingOpacity: number;
  incomingOpacity: number;
};

export function shouldAnimateJournalMonthGrid(
  prefersReducedMotion: boolean,
): boolean {
  return !prefersReducedMotion;
}

export function resolveJournalMonthGridLayers({
  incoming: _incoming,
  outgoing,
  prefersReducedMotion,
  isCrossfading,
}: {
  incoming: JournalMonthGridLayer;
  outgoing: JournalMonthGridLayer | null;
  prefersReducedMotion: boolean;
  isCrossfading: boolean;
}): { showOutgoing: boolean; showIncoming: boolean; animate: boolean } {
  if (!shouldAnimateJournalMonthGrid(prefersReducedMotion)) {
    return { showOutgoing: false, showIncoming: true, animate: false };
  }

  if (isCrossfading && outgoing !== null) {
    return { showOutgoing: true, showIncoming: true, animate: true };
  }

  return { showOutgoing: false, showIncoming: true, animate: false };
}

function sameMonth(
  a: JournalMonthGridLayer,
  b: JournalMonthGridLayer,
): boolean {
  return a.year === b.year && a.month === b.month;
}

export function createJournalMonthGridCrossfadeState(
  year: number,
  month: number,
  cells: readonly JournalCalendarCell[],
): JournalMonthGridCrossfadeState {
  return {
    incoming: { year, month, cells },
    outgoing: null,
    phase: 'static',
    outgoingOpacity: 0,
    incomingOpacity: 1,
  };
}

export function reduceJournalMonthGridCrossfade(
  state: JournalMonthGridCrossfadeState,
  action:
    | {
        type: 'sync';
        incoming: JournalMonthGridLayer;
        prefersReducedMotion: boolean;
      }
    | { type: 'run_crossfade_opacities' }
    | { type: 'crossfade_complete' },
): JournalMonthGridCrossfadeState {
  switch (action.type) {
    case 'sync': {
      if (action.prefersReducedMotion) {
        return createJournalMonthGridCrossfadeState(
          action.incoming.year,
          action.incoming.month,
          action.incoming.cells,
        );
      }

      if (sameMonth(state.incoming, action.incoming)) {
        return { ...state, incoming: action.incoming };
      }

      return {
        incoming: action.incoming,
        outgoing: {
          year: state.incoming.year,
          month: state.incoming.month,
          cells: state.incoming.cells,
        },
        phase: 'crossfade',
        outgoingOpacity: 1,
        incomingOpacity: 0,
      };
    }
    case 'run_crossfade_opacities':
      return {
        ...state,
        outgoingOpacity: 0,
        incomingOpacity: 1,
      };
    case 'crossfade_complete':
      return createJournalMonthGridCrossfadeState(
        state.incoming.year,
        state.incoming.month,
        state.incoming.cells,
      );
    default:
      return state;
  }
}

export function useJournalMonthGridCrossfade(
  year: number,
  month: number,
  cells: readonly JournalCalendarCell[],
  prefersReducedMotion: boolean,
): {
  outgoingLayer: JournalMonthGridRenderLayer | null;
  incomingLayer: JournalMonthGridRenderLayer;
  phase: JournalMonthGridCrossfadePhase;
} {
  const [state, dispatch] = useReducer(
    reduceJournalMonthGridCrossfade,
    { year, month, cells },
    (initial) =>
      createJournalMonthGridCrossfadeState(
        initial.year,
        initial.month,
        initial.cells,
      ),
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch({
      type: 'sync',
      incoming: { year, month, cells },
      prefersReducedMotion,
    });
  }, [year, month, cells, prefersReducedMotion]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (state.phase !== 'crossfade' || prefersReducedMotion) {
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        dispatch({ type: 'run_crossfade_opacities' });
        rafRef.current = null;
      });
    });

    timeoutRef.current = setTimeout(() => {
      dispatch({ type: 'crossfade_complete' });
      timeoutRef.current = null;
    }, JOURNAL_MONTH_GRID_CROSSFADE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    state.phase,
    state.incoming.year,
    state.incoming.month,
    prefersReducedMotion,
  ]);

  const layerResolution = resolveJournalMonthGridLayers({
    incoming: state.incoming,
    outgoing: state.outgoing,
    prefersReducedMotion,
    isCrossfading: state.phase === 'crossfade',
  });

  const outgoingLayer: JournalMonthGridRenderLayer | null =
    layerResolution.showOutgoing && state.outgoing
      ? {
          ...state.outgoing,
          opacity: state.outgoingOpacity,
        }
      : null;

  const incomingLayer: JournalMonthGridRenderLayer = {
    ...state.incoming,
    opacity: state.incomingOpacity,
  };

  return {
    outgoingLayer,
    incomingLayer,
    phase: layerResolution.animate ? 'crossfade' : 'static',
  };
}
