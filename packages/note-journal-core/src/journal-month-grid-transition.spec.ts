import { describe, expect, it } from 'vitest';
import { buildJournalCalendarCells } from './journal-calendar';
import {
  createJournalMonthGridCrossfadeState,
  reduceJournalMonthGridCrossfade,
  resolveJournalMonthGridLayers,
  shouldAnimateJournalMonthGrid,
} from './journal-month-grid-transition';

describe('shouldAnimateJournalMonthGrid', () => {
  it('returns false when reduced motion is preferred', () => {
    // Arrange & Act & Assert
    expect(shouldAnimateJournalMonthGrid(true)).toBe(false);
  });

  it('returns true when reduced motion is not preferred', () => {
    // Arrange & Act & Assert
    expect(shouldAnimateJournalMonthGrid(false)).toBe(true);
  });
});

describe('resolveJournalMonthGridLayers', () => {
  const january = {
    year: 2026,
    month: 0,
    cells: buildJournalCalendarCells(2026, 0),
  };
  const february = {
    year: 2026,
    month: 1,
    cells: buildJournalCalendarCells(2026, 1),
  };

  it('shows only incoming month without animation when reduced motion is preferred', () => {
    // Arrange & Act
    const result = resolveJournalMonthGridLayers({
      incoming: february,
      outgoing: january,
      prefersReducedMotion: true,
      isCrossfading: true,
    });

    // Assert
    expect(result).toEqual({
      showOutgoing: false,
      showIncoming: true,
      animate: false,
    });
  });

  it('shows both layers while crossfading when motion is allowed', () => {
    // Arrange & Act
    const result = resolveJournalMonthGridLayers({
      incoming: february,
      outgoing: january,
      prefersReducedMotion: false,
      isCrossfading: true,
    });

    // Assert
    expect(result).toEqual({
      showOutgoing: true,
      showIncoming: true,
      animate: true,
    });
  });

  it('shows only incoming month when not crossfading', () => {
    // Arrange & Act
    const result = resolveJournalMonthGridLayers({
      incoming: january,
      outgoing: null,
      prefersReducedMotion: false,
      isCrossfading: false,
    });

    // Assert
    expect(result).toEqual({
      showOutgoing: false,
      showIncoming: true,
      animate: false,
    });
  });
});

describe('reduceJournalMonthGridCrossfade', () => {
  const januaryCells = buildJournalCalendarCells(2026, 0);
  const februaryCells = buildJournalCalendarCells(2026, 1);
  const marchCells = buildJournalCalendarCells(2026, 2);

  it('keeps only incoming month when reduced motion is preferred', () => {
    // Arrange
    const state = createJournalMonthGridCrossfadeState(2026, 0, januaryCells);

    // Act
    const next = reduceJournalMonthGridCrossfade(state, {
      type: 'sync',
      incoming: { year: 2026, month: 1, cells: februaryCells },
      prefersReducedMotion: true,
    });

    // Assert
    expect(next.phase).toBe('static');
    expect(next.outgoing).toBeNull();
    expect(next.incoming.month).toBe(1);
    expect(next.incomingOpacity).toBe(1);
  });

  it('starts a crossfade when the visible month changes', () => {
    // Arrange
    const state = createJournalMonthGridCrossfadeState(2026, 0, januaryCells);

    // Act
    const next = reduceJournalMonthGridCrossfade(state, {
      type: 'sync',
      incoming: { year: 2026, month: 1, cells: februaryCells },
      prefersReducedMotion: false,
    });

    // Assert
    expect(next.phase).toBe('crossfade');
    expect(next.outgoing).toEqual({
      year: 2026,
      month: 0,
      cells: januaryCells,
    });
    expect(next.incoming.month).toBe(1);
    expect(next.outgoingOpacity).toBe(1);
    expect(next.incomingOpacity).toBe(0);
  });

  it('keeps the latest incoming month when month changes rapidly', () => {
    // Arrange
    let state = createJournalMonthGridCrossfadeState(2026, 0, januaryCells);

    // Act
    state = reduceJournalMonthGridCrossfade(state, {
      type: 'sync',
      incoming: { year: 2026, month: 1, cells: februaryCells },
      prefersReducedMotion: false,
    });
    state = reduceJournalMonthGridCrossfade(state, {
      type: 'sync',
      incoming: { year: 2026, month: 2, cells: marchCells },
      prefersReducedMotion: false,
    });

    // Assert
    expect(state.incoming).toEqual({
      year: 2026,
      month: 2,
      cells: marchCells,
    });
    expect(state.outgoing).toEqual({
      year: 2026,
      month: 1,
      cells: februaryCells,
    });
    expect(state.phase).toBe('crossfade');
  });
});
