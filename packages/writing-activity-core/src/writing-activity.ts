import { localDateKey } from './todays-note';

/** 5 intensity levels for the contribution graph. */
export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

/** Supported colour families for the activity graph (Tailwind ramps). */
export type WritingActivityColor = 'blue' | 'red' | 'pink' | 'rose';

const WRITING_ACTIVITY_COLORS: readonly WritingActivityColor[] = [
  'blue',
  'red',
  'pink',
  'rose',
];

export function parseWritingActivityColor(
  value: string | null | undefined,
): WritingActivityColor {
  if (
    value !== undefined &&
    value !== null &&
    (WRITING_ACTIVITY_COLORS as readonly string[]).includes(value)
  ) {
    return value;
  }
  return 'blue';
}

export function parseWritingActivityDays(
  value: unknown,
): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) {
    if (typeof count === 'number') {
      out[key] = count;
    }
  }
  return out;
}

/** Tailwind classes for each level per colour family. */
export const ACTIVITY_LEVEL_CLASSES: Record<
  WritingActivityColor,
  Record<ActivityLevel, string>
> = {
  blue: {
    0: 'bg-muted/20',
    1: 'bg-blue-200 dark:bg-blue-900',
    2: 'bg-blue-400 dark:bg-blue-700',
    3: 'bg-blue-600 dark:bg-blue-500',
    4: 'bg-blue-700 dark:bg-blue-400',
  },
  red: {
    0: 'bg-muted/20',
    1: 'bg-red-200 dark:bg-red-900',
    2: 'bg-red-400 dark:bg-red-700',
    3: 'bg-red-600 dark:bg-red-500',
    4: 'bg-red-700 dark:bg-red-400',
  },
  pink: {
    0: 'bg-muted/20',
    1: 'bg-pink-200 dark:bg-pink-900',
    2: 'bg-pink-400 dark:bg-pink-700',
    3: 'bg-pink-600 dark:bg-pink-500',
    4: 'bg-pink-700 dark:bg-pink-400',
  },
  rose: {
    0: 'bg-muted/20',
    1: 'bg-rose-200 dark:bg-rose-900',
    2: 'bg-rose-400 dark:bg-rose-700',
    3: 'bg-rose-600 dark:bg-rose-500',
    4: 'bg-rose-700 dark:bg-rose-400',
  },
};

/** Map from local YYYY-MM-DD to number of contributions that day. */
export type ActivityDays = Record<string, number>;

/** Bucket thresholds (locked in design): 0→0, 1→1, 2-3→2, 4-6→3, 7+→4 */
export function getActivityLevel(count: number): ActivityLevel {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/** One-time backfill from existing notes (creation + last update days). */
export function computeWritingActivityDaysFromNotes(
  notes: ReadonlyArray<{ created_at: string; updated_at: string }>,
): ActivityDays {
  const days: ActivityDays = {};
  for (const note of notes) {
    const c = localDateKey(new Date(note.created_at));
    const u = localDateKey(new Date(note.updated_at));
    days[c] = (days[c] ?? 0) + 1;
    if (u !== c) {
      days[u] = (days[u] ?? 0) + 1;
    }
  }
  return days;
}

/** Increment (or init to 1) for a single local day. Returns new map (immutable). */
export function incrementActivityDay(
  days: ActivityDays,
  dateKey: string,
): ActivityDays {
  return {
    ...days,
    [dateKey]: (days[dateKey] ?? 0) + 1,
  };
}

/** Current streak = consecutive days with activity ending today (local). */
export function computeCurrentStreak(days: ActivityDays): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 400; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    if ((days[key] ?? 0) > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/** Longest streak ever in the map. */
export function computeLongestStreak(days: ActivityDays): number {
  const sorted = Object.keys(days).sort();
  if (sorted.length === 0) return 0;

  let longest = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const key of sorted) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (prevDate && date.getTime() - prevDate.getTime() === 86400000) {
      current += 1;
    } else {
      current = 1;
    }
    if (current > longest) longest = current;
    prevDate = date;
  }
  return longest;
}

/** Count of days with >0 activity in the last 365 days (rolling). */
export function countActiveDaysLast365(days: ActivityDays): number {
  const today = new Date();
  let count = 0;
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if ((days[localDateKey(d)] ?? 0) > 0) count += 1;
  }
  return count;
}

/** Build 365-day rolling grid cells (Mon-first, like journal calendar). */
export type ActivityGridCell = {
  dateKey: string;
  date: Date;
  level: ActivityLevel;
  count: number;
};

export function buildActivityGridCells(days: ActivityDays): ActivityGridCell[] {
  const cells: ActivityGridCell[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364); // 365 days inclusive

  // Align to Monday
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);

  for (let i = 0; i < 371; i += 1) {
    // 53 weeks * 7
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = localDateKey(d);
    const count = days[key] ?? 0;
    cells.push({
      dateKey: key,
      date: d,
      level: getActivityLevel(count),
      count,
    });
  }
  return cells;
}
