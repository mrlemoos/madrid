import { describe, expect, it } from 'vitest';
import {
  NOTE_THEME_OPTIONS,
  parseNoteEditorSettings,
  noteSurfaceFonts,
} from './note-editor-settings';

describe('note-editor-settings re-exports', () => {
  it('re-exports parseNoteEditorSettings', () => {
    // Arrange
    const raw = null;

    // Act
    const result = parseNoteEditorSettings(raw);

    // Assert
    expect(result).toEqual({});
  });

  it('re-exports noteSurfaceFonts defaults', () => {
    // Arrange
    const settings = {};

    // Act
    const fonts = noteSurfaceFonts(settings);

    // Assert
    expect(fonts.title).toBe('instrumentSerif');
    expect(fonts.body).toBe('geistSans');
  });

  it('re-exports NOTE_THEME_OPTIONS', () => {
    // Arrange / Act
    const options = NOTE_THEME_OPTIONS;

    // Assert
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
  });
});
