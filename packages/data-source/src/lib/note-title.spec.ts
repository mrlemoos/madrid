import { describe, expect, it } from 'vitest';
import { persistedDisplayTitle } from './note-title.js';

describe('persistedDisplayTitle', () => {
  it('returns the trimmed title when non-empty', () => {
    // Arrange
    const raw = '  Meeting notes  ';

    // Act
    const result = persistedDisplayTitle(raw);

    // Assert
    expect(result).toBe('Meeting notes');
  });

  it('returns Untitled Note when the title is empty or whitespace', () => {
    // Arrange / Act / Assert
    expect(persistedDisplayTitle('')).toBe('Untitled Note');
    expect(persistedDisplayTitle('   ')).toBe('Untitled Note');
  });
});
