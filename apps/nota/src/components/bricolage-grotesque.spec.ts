import { describe, expect, it } from 'vitest';

import { bricolageGrotesqueStyle } from './bricolage-grotesque';

describe('bricolageGrotesqueStyle', () => {
  it('names the variable face first, then falls back to system sans', () => {
    // Arrange|Act
    const families = bricolageGrotesqueStyle.fontFamily
      .split(',')
      .map((f) => f.trim().replaceAll('"', ''));

    // Assert — the variable file may not have loaded on first paint
    expect(families[0]).toBe('Bricolage Grotesque Variable');
    expect(families.at(-1)).toBe('sans-serif');
  });
});
