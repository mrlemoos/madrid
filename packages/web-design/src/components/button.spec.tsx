import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotaButton, notaButtonVariants } from './button.js';

describe('NotaButton (named exports)', () => {
  it('exposes NotaButton and notaButtonVariants', () => {
    // Assert
    expect(NotaButton).toBeDefined();
    expect(notaButtonVariants).toBeDefined();
  });
});

describe('NotaButton (smoke)', () => {
  it('renders with default variant classes', () => {
    // Arrange|Act
    render(<NotaButton type="button">Save</NotaButton>);

    // Assert
    const el = screen.getByRole('button', { name: 'Save' });
    expect(el.className).toContain('bg-primary');
  });
});

describe('NotaButton press asymmetry', () => {
  it('presses in faster and shallower than the release ease-out', () => {
    // Arrange
    const classes = notaButtonVariants();

    // Act — parse duration tokens from the base CVA string
    const releaseMs = Number(
      classes.match(/(?:^|\s)duration-\[(\d+)ms\]/)?.[1] ?? NaN,
    );
    const pressInMs = Number(
      classes.match(/active:duration-\[(\d+)ms\]/)?.[1] ?? NaN,
    );

    // Assert
    expect(classes).toContain('motion-safe:active:scale-[0.97]');
    expect(releaseMs).toBe(160);
    expect(pressInMs).toBe(100);
    expect(pressInMs).toBeLessThan(releaseMs);
  });
});
