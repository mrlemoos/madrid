import { describe, expect, it } from 'vitest';

import {
  notaKbdFooterClass,
  notaKbdHintClass,
  notaKbdReferenceValueClass,
} from './nota-kbd-styles';

describe('nota keyboard hint styles', () => {
  it('pushes palette hints to the trailing edge', () => {
    // Arrange|Act|Assert — the palette row has no layout of its own
    expect(notaKbdHintClass).toContain('ml-auto');
  });

  it('leaves the reference page to own its own spacing', () => {
    // Arrange|Act|Assert — the shortcuts page lays rows out itself
    expect(notaKbdReferenceValueClass).not.toContain('ml-auto');
  });

  it('keeps every keyboard token on tabular numerals so widths do not jitter', () => {
    // Arrange
    const tokens = [
      notaKbdHintClass,
      notaKbdFooterClass,
      notaKbdReferenceValueClass,
    ];

    // Act|Assert
    for (const token of tokens) {
      expect(token).toContain('tabular-nums');
    }
  });
});
