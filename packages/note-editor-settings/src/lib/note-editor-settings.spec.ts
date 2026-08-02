import type { Json, Note } from '@nota/database-types';
import { describe, expect, it } from 'vitest';

import {
  filterNotesForNoteGraph,
  isNoteVisibleInNoteGraph,
  NOTE_THEME_LABEL,
  NOTE_THEME_OPTIONS,
  noteEditorFontFromThemeSelectValue,
  noteEditorSettingsToJson,
  noteSurfaceClassNames,
  noteSurfaceFonts,
  noteSurfaceMaxWidthPx,
  noteThemeSelectValue,
  parseNoteEditorSettings,
} from './note-editor-settings';

describe('parseNoteEditorSettings', () => {
  it('returns empty object for null', () => {
    // Act
    const result = parseNoteEditorSettings(null);

    // Assert
    expect(result).toEqual({});
  });

  it('preserves sans (Ottawa theme)', () => {
    // Arrange
    const raw = { font: 'sans' } as Json;

    // Act
    const result = parseNoteEditorSettings(raw);

    // Assert
    expect(result).toEqual({ font: 'sans' });
  });
});

describe('noteSurfaceFonts', () => {
  it('uses London (Instrument + Geist) for empty settings', () => {
    // Arrange
    const settings = {};

    // Act
    const result = noteSurfaceFonts(settings);

    // Assert
    expect(result).toEqual({
      title: 'instrumentSerif',
      body: 'geistSans',
      measure: 'standard',
    });
  });

  it('maps Ottawa to Inter', () => {
    // Arrange
    const settings = { font: 'sans' as const };

    // Act
    const result = noteSurfaceFonts(settings);

    // Assert
    expect(result).toEqual({
      title: 'inter',
      body: 'inter',
      measure: 'standard',
    });
  });

  it('maps York to Instrument Serif title and Source Serif body', () => {
    // Arrange
    const settings = { font: 'york' as const, measure: 'narrow' as const };

    // Act
    const result = noteSurfaceFonts(settings);

    // Assert
    expect(result).toEqual({
      title: 'instrumentSerif',
      body: 'sourceSerif4',
      measure: 'narrow',
    });
  });

  it('maps San Francisco to system mono', () => {
    // Arrange
    const settings = { font: 'mono' as const, measure: 'wide' as const };

    // Act
    const result = noteSurfaceFonts(settings);

    // Assert
    expect(result).toEqual({
      title: 'systemMono',
      body: 'systemMono',
      measure: 'wide',
    });
  });
});

describe('noteSurfaceClassNames', () => {
  it('uses London (Instrument + Geist) and standard width for empty settings', () => {
    // Arrange
    const settings = {};

    // Act
    const result = noteSurfaceClassNames(settings);

    // Assert
    expect(result).toEqual({
      maxWidthClass: 'max-w-3xl',
      titleFontClass: 'font-serif',
      bodyFontClass: 'font-london-body',
    });
  });

  it('maps Ottawa (sans) with narrow measure', () => {
    const settings = { font: 'sans' as const, measure: 'narrow' as const };
    expect(noteSurfaceClassNames(settings)).toEqual({
      maxWidthClass: 'max-w-prose',
      titleFontClass: 'font-sans',
      bodyFontClass: 'font-sans',
    });
  });
});

describe('noteSurfaceMaxWidthPx', () => {
  it('maps measure tokens to layout widths', () => {
    // Arrange
    const narrow = { measure: 'narrow' as const };
    const wide = { measure: 'wide' as const };

    // Act
    const narrowPx = noteSurfaceMaxWidthPx(narrow);
    const standardPx = noteSurfaceMaxWidthPx({});
    const widePx = noteSurfaceMaxWidthPx(wide);

    // Assert
    expect(narrowPx).toBeLessThan(standardPx);
    expect(widePx).toBeGreaterThan(standardPx);
  });
});

describe('note theme copy', () => {
  it('exposes Note theme label and city option names', () => {
    expect(NOTE_THEME_LABEL).toBe('Note theme');
    expect(NOTE_THEME_OPTIONS.map((o) => o.label)).toEqual([
      'London',
      'York',
      'Ottawa',
      'San Francisco',
      'Oviedo',
    ]);
  });
});

describe('noteEditorFontFromThemeSelectValue', () => {
  it('maps each option value to the persisted font field', () => {
    expect(noteEditorFontFromThemeSelectValue('')).toBeUndefined();
    expect(noteEditorFontFromThemeSelectValue('sans')).toBe('sans');
    expect(noteEditorFontFromThemeSelectValue('mono')).toBe('mono');
    expect(noteEditorFontFromThemeSelectValue('york')).toBe('york');
    expect(noteEditorFontFromThemeSelectValue('oviedo')).toBe('oviedo');
  });
});

describe('noteSurfaceFonts Oviedo', () => {
  it('maps Oviedo to Nunito title and body', () => {
    // Arrange
    const settings = { font: 'oviedo' as const };

    // Act
    const result = noteSurfaceFonts(settings);

    // Assert
    expect(result).toEqual({
      title: 'nunito',
      body: 'nunito',
      measure: 'standard',
    });
  });
});

describe('filterNotesForNoteGraph', () => {
  it('drops notes with showInNoteGraph false', () => {
    const notes = [
      { id: 'a', editor_settings: {} },
      { id: 'b', editor_settings: { showInNoteGraph: false } },
    ] as Note[];

    expect(filterNotesForNoteGraph(notes).map((n) => n.id)).toEqual(['a']);
  });
});

describe('isNoteVisibleInNoteGraph', () => {
  it('defaults to visible', () => {
    expect(isNoteVisibleInNoteGraph({ editor_settings: null })).toBe(true);
  });
});

describe('noteEditorSettingsToJson', () => {
  it('omits London default font', () => {
    expect(noteEditorSettingsToJson({})).toEqual({});
  });
});

describe('noteThemeSelectValue', () => {
  it('maps stored font to select value', () => {
    expect(noteThemeSelectValue({ font: 'york' })).toBe('york');
  });
});
