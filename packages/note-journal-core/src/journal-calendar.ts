/** Monday-first weekday index: Monday = 0, Sunday = 6. */
export function mondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export type JournalCalendarCell = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
};

function padDateKey(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${String(year)}-${mm}-${dd}`;
}

export function dateKeyFromParts(
  year: number,
  month: number,
  day: number,
): string {
  return padDateKey(year, month, day);
}

export function parseDateKey(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = dateKey.split('-').map((part) => Number.parseInt(part, 10));
  return { year: y, month: m, day: d };
}

/** Build a Monday-first grid for `month` (0-based) in `year`. */
export function buildJournalCalendarCells(
  year: number,
  month: number,
): JournalCalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const leading = mondayBasedWeekday(firstOfMonth);
  const gridStart = new Date(year, month, 1 - leading);
  const cells: JournalCalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    );
    cells.push({
      date,
      dateKey: dateKeyFromParts(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      ),
      inMonth: date.getMonth() === month,
    });
  }

  return cells;
}
