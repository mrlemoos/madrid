import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localDateKey } from '@getmadrid/note-journal-core/local-date-key';

import { JournalCalendar } from './journal-calendar';

const MARCH_2026 = { year: 2026, month: 2 };

function props(overrides: Record<string, unknown> = {}) {
  return {
    ...MARCH_2026,
    dateKeysWithNotes: new Set<string>(),
    selectedDateKey: null,
    onSelectDateKey: vi.fn(),
    onMonthChange: vi.fn(),
    onJumpToToday: vi.fn(),
    ...overrides,
  } as Parameters<typeof JournalCalendar>[0] & {
    onSelectDateKey: ReturnType<typeof vi.fn>;
    onMonthChange: ReturnType<typeof vi.fn>;
    onJumpToToday: ReturnType<typeof vi.fn>;
  };
}

/** The day cell inside the live grid (the crossfade layer is presentational). */
function dayCell(day: string) {
  return within(screen.getByRole('grid')).getByRole('gridcell', {
    name: new RegExp(`^${day}$`),
  });
}

beforeEach(() => {
  vi.setSystemTime(new Date(2026, 2, 4, 9, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('JournalCalendar', () => {
  it('names the month it is showing', () => {
    // Arrange|Act
    render(<JournalCalendar {...props()} />);

    // Assert
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain(
      '2026',
    );
  });

  it('steps back and forward a month, rolling the year over', () => {
    // Arrange
    const p = props({ year: 2026, month: 0 });
    render(<JournalCalendar {...p} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));

    // Assert
    expect(p.onMonthChange).toHaveBeenNthCalledWith(1, 2025, 11);
    expect(p.onMonthChange).toHaveBeenNthCalledWith(2, 2026, 1);
  });

  it('selects a day, and clicking it again clears the filter', () => {
    // Arrange
    const p = props();
    const { rerender } = render(<JournalCalendar {...p} />);

    // Act
    fireEvent.click(dayCell('12'));
    rerender(<JournalCalendar {...p} selectedDateKey="2026-03-12" />);
    fireEvent.click(dayCell('12'));

    // Assert
    expect(p.onSelectDateKey).toHaveBeenNthCalledWith(1, '2026-03-12');
    expect(p.onSelectDateKey).toHaveBeenNthCalledWith(2, null);
  });

  it('marks the selected day for assistive tech', () => {
    // Arrange|Act
    render(<JournalCalendar {...props({ selectedDateKey: '2026-03-12' })} />);

    // Assert
    expect(dayCell('12').getAttribute('aria-selected')).toBe('true');
  });

  it('ignores the padding days from neighbouring months', () => {
    // Arrange
    const p = props();
    render(<JournalCalendar {...p} />);

    // Act — March 2026 starts on a Sunday, so the grid opens with padding
    const cells = within(screen.getByRole('grid')).getAllByRole('gridcell');
    fireEvent.click(cells[0]);

    // Assert
    expect((cells[0] as HTMLButtonElement).disabled).toBe(true);
    expect(p.onSelectDateKey).not.toHaveBeenCalled();
  });

  it('dots the days that have notes', () => {
    // Arrange|Act
    render(
      <JournalCalendar
        {...props({ dateKeysWithNotes: new Set(['2026-03-12']) })}
      />,
    );

    // Assert — the dot is the only signal that a day holds writing
    expect(dayCell('12').querySelectorAll('span[aria-hidden]')).toHaveLength(1);
    expect(
      dayCell('13').querySelector('span[aria-hidden]')?.className,
    ).not.toContain('rounded-full');
  });

  it('offers a way back to today only while looking at another month', () => {
    // Arrange|Act
    const { rerender } = render(<JournalCalendar {...props()} />);

    // Assert
    expect(screen.queryByRole('button', { name: 'Go to today' })).toBeNull();

    // Act
    rerender(<JournalCalendar {...props({ year: 2025, month: 11 })} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Go to today' })).toBeTruthy();
  });

  it('jumps back to today when asked', () => {
    // Arrange
    const p = props({ year: 2025, month: 11 });
    render(<JournalCalendar {...p} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Go to today' }));

    // Assert
    expect(p.onJumpToToday).toHaveBeenCalledTimes(1);
  });

  it('labels the grid and its weekday header', () => {
    // Arrange|Act
    render(<JournalCalendar {...props()} />);

    // Assert
    expect(screen.getByRole('grid', { name: 'Journal calendar' })).toBeTruthy();
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeTruthy();
    }
  });

  it('reads today from the clock, not from the month being viewed', () => {
    // Arrange|Act
    render(<JournalCalendar {...props()} />);

    // Assert — padding cells repeat the numeral, so only the in-month one counts
    expect(localDateKey(new Date())).toBe('2026-03-04');
    const fourths = within(screen.getByRole('grid'))
      .getAllByRole('gridcell', { name: /^4$/ })
      .filter((cell) => !(cell as HTMLButtonElement).disabled);
    expect(fourths).toHaveLength(1);
  });
});
