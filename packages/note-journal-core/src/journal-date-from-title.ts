import * as chrono from 'chrono-node';
import { localDateKey } from './todays-note';

const UNTITLED = 'Untitled Note';

/** Parse a calendar date from a note title using natural-language date parsing. */
export function parseJournalDateFromTitle(title: string): Date | null {
  const trimmed = title.trim();
  if (!trimmed || trimmed === UNTITLED) {
    return null;
  }

  const results = chrono.parse(trimmed, new Date(), { forwardDate: false });
  const first = results.at(0);
  if (first === undefined) {
    return null;
  }

  const parsed = first.start.date();
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/** Local calendar `YYYY-MM-DD` for a journal title, or null when not parseable. */
export function journalDateKeyFromTitle(title: string): string | null {
  const date = parseJournalDateFromTitle(title);
  if (!date) {
    return null;
  }
  return localDateKey(date);
}
