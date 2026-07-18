import { describe, expect, it } from 'vitest';

import {
  NOTA_DIALOG_MOTION_CLASS,
  NOTA_POPUP_MOTION_CLASS,
  NOTA_TOOLTIP_MOTION_CLASS,
} from './nota-popup-motion.js';

describe('NOTA_POPUP_MOTION_CLASS', () => {
  it('includes Base UI popup enter/exit motion tokens (transform + opacity only)', () => {
    // Arrange
    const classes = NOTA_POPUP_MOTION_CLASS.split(/\s+/).filter(Boolean);

    // Assert
    for (const token of [
      'origin-[var(--transform-origin)]',
      'transition-[transform,opacity]',
      'duration-200',
      'ease-out',
      'data-[starting-style]:scale-95',
      'data-[ending-style]:scale-95',
      'data-[starting-style]:opacity-0',
      'data-[ending-style]:opacity-0',
    ]) {
      expect(classes).toContain(token);
    }
    expect(classes.join(' ')).not.toContain('scale,opacity');
  });
});

describe('NOTA_TOOLTIP_MOTION_CLASS', () => {
  it('uses a lighter trigger-origin enter with scale-95 (no scale(0))', () => {
    // Arrange
    const classes = NOTA_TOOLTIP_MOTION_CLASS.split(/\s+/).filter(Boolean);

    // Assert
    expect(classes).toContain('origin-[var(--transform-origin)]');
    expect(classes).toContain('transition-[transform,opacity]');
    expect(classes).toContain('duration-150');
    expect(classes).toContain('ease-out');
    expect(classes).toContain('data-[starting-style]:scale-95');
    expect(classes).toContain('data-[ending-style]:scale-95');
    expect(classes).toContain('data-[starting-style]:opacity-0');
    expect(classes).toContain('data-[ending-style]:opacity-0');
    expect(NOTA_TOOLTIP_MOTION_CLASS).not.toMatch(/scale-0\b/);
  });
});

describe('NOTA_DIALOG_MOTION_CLASS', () => {
  it('centres pointer-open dialog enter on scale-95 + opacity', () => {
    // Arrange
    const classes = NOTA_DIALOG_MOTION_CLASS.split(/\s+/).filter(Boolean);

    // Assert
    expect(classes).toContain('origin-center');
    expect(classes).toContain('transition-[transform,opacity]');
    expect(classes).toContain('duration-150');
    expect(classes).toContain('data-[starting-style]:scale-95');
    expect(classes).toContain('data-[starting-style]:opacity-0');
  });
});
