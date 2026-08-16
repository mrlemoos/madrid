import { describe, expect, it } from 'vitest';
import { persistedDisplayTitle } from './note-title';

describe('persistedDisplayTitle', () => {
  it('returns trimmed title when non-empty', () => {
    // Arrange
    const raw = '  Hello  ';

    // Act
    const result = persistedDisplayTitle(raw);

    // Assert
    expect(result).toBe('Hello');
  });

  it('returns Untitled Note for empty or whitespace', () => {
    // Arrange
    const empty = '';
    const whitespace = '   ';

    // Act
    const emptyResult = persistedDisplayTitle(empty);
    const wsResult = persistedDisplayTitle(whitespace);

    // Assert
    expect(emptyResult).toBe('Untitled Note');
    expect(wsResult).toBe('Untitled Note');
  });
});
