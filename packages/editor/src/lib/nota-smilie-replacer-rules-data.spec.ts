import { describe, expect, it } from 'vitest';
import { NOTA_SMILIE_REPLACEMENTS } from './nota-smilie-replacer-rules-data';

describe('NOTA_SMILIE_REPLACEMENTS', () => {
  it('is a non-empty list of find/replace pairs', () => {
    // Arrange
    const rules = NOTA_SMILIE_REPLACEMENTS;

    // Act
    const first = rules[0];

    // Assert
    expect(rules.length).toBeGreaterThan(10);
    expect(first?.find).toBeInstanceOf(RegExp);
    expect(typeof first?.replace).toBe('string');
  });

  it('matches smileys that end with a trailing space', () => {
    // Arrange
    const smile = ':-) ';
    const heart = '<3 ';

    // Act
    const smileRule = NOTA_SMILIE_REPLACEMENTS.find((r) => r.find.test(smile));
    const heartRule = NOTA_SMILIE_REPLACEMENTS.find((r) => r.find.test(heart));

    // Assert
    expect(smileRule?.replace).toBe('🙂 ');
    expect(heartRule?.replace).toBe('❤️ ');
  });
});
