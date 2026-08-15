import { describe, expect, test } from 'vitest';
import { parseSemanticSearchQuery } from './semantic-search-query.server';

describe('parseSemanticSearchQuery', () => {
  test('semantic only', () => {
    // Arrange
    const raw = 'that weird bug with the router';

    // Act
    const parsed = parseSemanticSearchQuery(raw);

    // Assert
    expect(parsed).toEqual({
      semantic: 'that weird bug with the router',
      literals: [],
    });
  });

  test('literal only', () => {
    // Arrange
    const raw = '"Next.js router"';

    // Act
    const parsed = parseSemanticSearchQuery(raw);

    // Assert
    expect(parsed).toEqual({
      semantic: '',
      literals: ['Next.js router'],
    });
  });

  test('mixed semantic and quoted literal', () => {
    // Arrange
    const raw = 'summer "Next.js" bug';

    // Act
    const parsed = parseSemanticSearchQuery(raw);

    // Assert
    expect(parsed).toEqual({
      semantic: 'summer bug',
      literals: ['Next.js'],
    });
  });

  test('escaped quote inside literal', () => {
    // Arrange
    const raw = '"say \\"hello\\""';

    // Act
    const parsed = parseSemanticSearchQuery(raw);

    // Assert
    expect(parsed).toEqual({
      semantic: '',
      literals: ['say "hello"'],
    });
  });

  test('multiple literals', () => {
    // Arrange
    const raw = '"foo" bar "baz"';

    // Act
    const parsed = parseSemanticSearchQuery(raw);

    // Assert
    expect(parsed).toEqual({
      semantic: 'bar',
      literals: ['foo', 'baz'],
    });
  });
});
