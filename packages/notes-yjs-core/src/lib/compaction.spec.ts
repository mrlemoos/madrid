import { DEFAULT_COMPACTION_THRESHOLD, shouldCompact } from './compaction';

describe('shouldCompact', () => {
  it('does not compact at or below the threshold', () => {
    // Arrange
    const count = DEFAULT_COMPACTION_THRESHOLD;

    // Act
    const result = shouldCompact(count);

    // Assert
    expect(result).toBe(false);
  });

  it('compacts once the log grows past the threshold', () => {
    // Arrange
    const count = DEFAULT_COMPACTION_THRESHOLD + 1;

    // Act
    const result = shouldCompact(count);

    // Assert
    expect(result).toBe(true);
  });

  it('honours a caller-supplied threshold', () => {
    // Arrange
    const threshold = 3;

    // Act & Assert
    expect(shouldCompact(3, threshold)).toBe(false);
    expect(shouldCompact(4, threshold)).toBe(true);
  });
});
