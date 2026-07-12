import { describe, expect, it } from 'vitest';

import { NOTA_POPUP_MOTION_CLASS } from './nota-popup-motion.js';

describe('NOTA_POPUP_MOTION_CLASS', () => {
  it('includes Base UI popup enter/exit motion tokens', () => {
    // Arrange
    const classes = NOTA_POPUP_MOTION_CLASS.split(/\s+/).filter(Boolean);

    // Assert
    for (const token of [
      'origin-[var(--transform-origin)]',
      'transition-[transform,scale,opacity]',
      'duration-200',
      'ease-out',
      'data-[starting-style]:scale-95',
      'data-[ending-style]:scale-95',
      'data-[starting-style]:opacity-0',
      'data-[ending-style]:opacity-0',
    ]) {
      expect(classes).toContain(token);
    }
  });
});
