import { describe, expect, it } from 'vitest';
import { findFlightCodes } from './flight-code';

describe('findFlightCodes', () => {
  it('detects a known-airline code with and without a space', () => {
    // Arrange
    const text = 'My flight is AA123 then BA 456 home.';

    // Act
    const matches = findFlightCodes(text);

    // Assert
    expect(matches.map((m) => m.code)).toEqual(['AA123', 'BA456']);
    expect(text.slice(matches[0].start, matches[0].end)).toBe('AA123');
    expect(text.slice(matches[1].start, matches[1].end)).toBe('BA 456');
  });

  it('ignores tokens whose prefix is not a known airline', () => {
    // Arrange
    const text = 'Ref IN2024 order onto US50 lane';

    // Act
    const codes = findFlightCodes(text).map((m) => m.code);

    // Assert
    expect(codes).toEqual([]);
  });

  it('ignores lowercase prose that merely looks code-like', () => {
    // Arrange
    const text = 'aa123 was a great year';

    // Act
    const codes = findFlightCodes(text).map((m) => m.code);

    // Assert
    expect(codes).toEqual([]);
  });
});
