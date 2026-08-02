import {
  journalDateKeyFromTitle,
  parseJournalDateFromTitle,
} from './journal-date-from-title';
import { extractJournalNoteListPreviewFromDocJson } from './note-doc-plain-text';

export type JournalNoteSource = {
  id: string;
  title: string;
  updated_at: string;
  content?: unknown;
};

export type JournalEntry = {
  noteId: string;
  title: string;
  date: Date;
  dateKey: string;
  updatedAt: string;
  bodyPreview: string;
};

export function buildJournalEntriesFromNotes(
  notes: readonly JournalNoteSource[],
): JournalEntry[] {
  const entries: JournalEntry[] = [];

  for (const note of notes) {
    const date = parseJournalDateFromTitle(note.title);
    const dateKey = journalDateKeyFromTitle(note.title);
    if (!date || !dateKey) {
      continue;
    }
    entries.push({
      noteId: note.id,
      title: note.title.trim(),
      date,
      dateKey,
      updatedAt: note.updated_at,
      bodyPreview: extractJournalNoteListPreviewFromDocJson(note.content),
    });
  }

  entries.sort((a, b) => {
    const dayDiff = b.date.getTime() - a.date.getTime();
    if (dayDiff !== 0) {
      return dayDiff;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return entries;
}

export function hasJournalNotes(notes: readonly JournalNoteSource[]): boolean {
  return notes.some((note) => journalDateKeyFromTitle(note.title) !== null);
}

export function journalDateKeysFromEntries(
  entries: readonly JournalEntry[],
): Set<string> {
  return new Set(entries.map((entry) => entry.dateKey));
}

export function filterJournalEntriesByDateKey(
  entries: readonly JournalEntry[],
  dateKey: string | null,
): JournalEntry[] {
  if (!dateKey) {
    return [...entries];
  }
  return entries.filter((entry) => entry.dateKey === dateKey);
}
