import { z } from 'zod';
import type { Json, Note } from '@nota/database-types';

const noteEditorSettingsSchema = z.object({
  font: z.enum(['sans', 'serif', 'mono', 'york', 'oviedo']).optional(),
  measure: z.enum(['narrow', 'wide']).optional(),
  showInNoteGraph: z.boolean().optional(),
});

export type NoteEditorSettings = z.infer<typeof noteEditorSettingsSchema>;

export const NOTE_THEME_LABEL = 'Note theme' as const;

export const NOTE_THEME_OPTIONS = [
  { value: '' as const, label: 'London' },
  { value: 'york' as const, label: 'York' },
  { value: 'sans' as const, label: 'Ottawa' },
  { value: 'mono' as const, label: 'San Francisco' },
  { value: 'oviedo' as const, label: 'Oviedo' },
] as const;

/** Logical font roles shared by web Tailwind classes and native fontFamily. */
export type NotaSurfaceFontRole =
  | 'inter'
  | 'instrumentSerif'
  | 'geistSans'
  | 'sourceSerif4'
  | 'systemMono'
  | 'nunito';

export type NotaSurfaceMeasure = 'standard' | 'narrow' | 'wide';

/** Web `max-w-*` widths (48rem / 65ch / 64rem) as pixels for native layout. */
export const NOTE_SURFACE_MAX_WIDTH_PX: Record<NotaSurfaceMeasure, number> = {
  narrow: 520,
  standard: 768,
  wide: 1024,
};

/** Value for the note theme `<select>`: London is default or legacy `serif`. */
export function noteThemeSelectValue(
  settings: NoteEditorSettings,
): (typeof NOTE_THEME_OPTIONS)[number]['value'] {
  if (settings.font === 'sans') {
    return 'sans';
  }
  if (settings.font === 'mono') {
    return 'mono';
  }
  if (settings.font === 'york') {
    return 'york';
  }
  if (settings.font === 'oviedo') {
    return 'oviedo';
  }
  return '';
}

/**
 * Maps the note theme `<select>` value (`<option value>`) to `editor_settings.font`.
 * London is stored as omitted `font` (`undefined`); unknown strings yield `undefined`.
 */
export function noteEditorFontFromThemeSelectValue(
  selectValue: string,
): NoteEditorSettings['font'] | undefined {
  switch (selectValue) {
    case '':
      return undefined;
    case 'sans':
      return 'sans';
    case 'mono':
      return 'mono';
    case 'york':
      return 'york';
    case 'oviedo':
      return 'oviedo';
    default:
      return undefined;
  }
}

/** Parse `notes.editor_settings` JSON; invalid or non-objects yield `{}`. */
export function parseNoteEditorSettings(
  raw: Note['editor_settings'] | null | undefined,
): NoteEditorSettings {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const parsed = noteEditorSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {};
  }
  return parsed.data;
}

/** Minimal JSON for Supabase; omit keys that match app defaults. */
export function noteEditorSettingsToJson(settings: NoteEditorSettings): Json {
  const o: Record<string, unknown> = {};
  if (
    settings.font === 'sans' ||
    settings.font === 'mono' ||
    settings.font === 'york' ||
    settings.font === 'oviedo'
  ) {
    o.font = settings.font;
  }
  if (settings.measure) {
    o.measure = settings.measure;
  }
  if (settings.showInNoteGraph === false) {
    o.showInNoteGraph = false;
  }
  return o as Json;
}

/** Default: notes appear in the graph unless `editor_settings.showInNoteGraph === false`. */
export function isNoteVisibleInNoteGraph(
  note: Pick<Note, 'editor_settings'>,
): boolean {
  return (
    parseNoteEditorSettings(note.editor_settings).showInNoteGraph !== false
  );
}

export function filterNotesForNoteGraph(notes: Note[]): Note[] {
  return notes.filter(isNoteVisibleInNoteGraph);
}

function surfaceMeasure(settings: NoteEditorSettings): NotaSurfaceMeasure {
  if (settings.measure === 'narrow') {
    return 'narrow';
  }
  if (settings.measure === 'wide') {
    return 'wide';
  }
  return 'standard';
}

/** Platform-neutral note surface fonts (London / York / Ottawa / San Francisco). */
export function noteSurfaceFonts(settings: NoteEditorSettings): {
  title: NotaSurfaceFontRole;
  body: NotaSurfaceFontRole;
  measure: NotaSurfaceMeasure;
} {
  const measure = surfaceMeasure(settings);

  if (settings.font === 'mono') {
    return { title: 'systemMono', body: 'systemMono', measure };
  }
  if (settings.font === 'sans') {
    return { title: 'inter', body: 'inter', measure };
  }
  if (settings.font === 'york') {
    return { title: 'instrumentSerif', body: 'sourceSerif4', measure };
  }
  if (settings.font === 'oviedo') {
    return { title: 'nunito', body: 'nunito', measure };
  }
  return { title: 'instrumentSerif', body: 'geistSans', measure };
}

export function noteSurfaceMaxWidthPx(settings: NoteEditorSettings): number {
  return NOTE_SURFACE_MAX_WIDTH_PX[noteSurfaceFonts(settings).measure];
}

const TITLE_FONT_CLASS: Record<NotaSurfaceFontRole, string> = {
  inter: 'font-sans',
  instrumentSerif: 'font-serif',
  geistSans: 'font-serif',
  sourceSerif4: 'font-serif',
  systemMono: 'font-mono',
  nunito: 'font-nunito',
};

const BODY_FONT_CLASS: Record<NotaSurfaceFontRole, string> = {
  inter: 'font-sans',
  instrumentSerif: 'font-serif',
  geistSans: 'font-london-body',
  sourceSerif4: 'font-note-body',
  systemMono: 'font-mono',
  nunito: 'font-nunito',
};

const MEASURE_CLASS: Record<NotaSurfaceMeasure, string> = {
  standard: 'max-w-3xl',
  narrow: 'max-w-prose',
  wide: 'max-w-5xl',
};

export function noteSurfaceClassNames(settings: NoteEditorSettings): {
  maxWidthClass: string;
  titleFontClass: string;
  bodyFontClass: string;
} {
  const fonts = noteSurfaceFonts(settings);
  return {
    maxWidthClass: MEASURE_CLASS[fonts.measure],
    titleFontClass: TITLE_FONT_CLASS[fonts.title],
    bodyFontClass: BODY_FONT_CLASS[fonts.body],
  };
}
