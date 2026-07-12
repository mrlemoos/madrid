import { describe, expect, it } from 'vitest';

import { NOTA_EASE_IN_OUT, NOTA_EASE_OUT } from './motion-tokens.js';

describe('motion-tokens', () => {
  it('exports canonical strong ease-out for press and hover micro-interactions', () => {
    // Arrange / Act / Assert
    expect(NOTA_EASE_OUT).toBe('cubic-bezier(0.23, 1, 0.32, 1)');
  });

  it('exports canonical ease-in-out for on-screen movement', () => {
    // Arrange / Act / Assert
    expect(NOTA_EASE_IN_OUT).toBe('cubic-bezier(0.77, 0, 0.175, 1)');
  });
});
