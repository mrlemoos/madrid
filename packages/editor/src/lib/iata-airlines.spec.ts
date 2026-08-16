import { describe, expect, it } from 'vitest';
import { IATA_AIRLINE_CODES, isKnownAirlineCode } from './iata-airlines';

describe('isKnownAirlineCode', () => {
  it('returns true for known codes case-insensitively', () => {
    // Arrange
    const upper = 'AA';
    const lower = 'ba';

    // Act
    const upperResult = isKnownAirlineCode(upper);
    const lowerResult = isKnownAirlineCode(lower);

    // Assert
    expect(upperResult).toBe(true);
    expect(lowerResult).toBe(true);
  });

  it('returns false for unknown prefixes', () => {
    // Arrange
    const unknown = 'IN';

    // Act
    const result = isKnownAirlineCode(unknown);

    // Assert
    expect(result).toBe(false);
  });
});

describe('IATA_AIRLINE_CODES', () => {
  it('includes major carriers', () => {
    // Arrange
    const majors = ['AA', 'DL', 'UA', 'BA', 'LH', 'SQ'];

    // Act
    const allPresent = majors.every((c) => IATA_AIRLINE_CODES.has(c));

    // Assert
    expect(allPresent).toBe(true);
    expect(IATA_AIRLINE_CODES.size).toBeGreaterThan(50);
  });
});
