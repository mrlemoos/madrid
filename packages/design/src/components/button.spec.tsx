import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button, buttonVariants } from './button.js';

describe('Button (named exports)', () => {
  it('exposes Button and buttonVariants', () => {
    // Assert
    expect(Button).toBeDefined();
    expect(buttonVariants).toBeDefined();
  });
});

describe('Button (smoke)', () => {
  it('renders with default variant classes', () => {
    // Arrange|Act
    render(<Button type="button">Save</Button>);

    // Assert
    const el = screen.getByRole('button', { name: 'Save' });
    expect(el.className).toContain('bg-primary');
  });
});

describe('Button press feedback', () => {
  it('presses in on the strong ease-out token, with scale and brightness', () => {
    // Arrange
    const classes = buttonVariants();

    // Act — press reads CSS tokens so chrome and Button stay in lockstep
    const usesTokenEase = classes.includes('ease-[var(--ease-out)]');
    const usesTokenPressOut = classes.includes(
      'duration-[var(--nota-press-out-ms)]',
    );
    const usesTokenPressIn = classes.includes(
      'motion-safe:active:duration-[var(--nota-press-in-ms)]',
    );
    const usesTokenScale = classes.includes(
      'motion-safe:active:scale-[var(--nota-press-scale)]',
    );
    const darkensOnPress = classes.includes('active:brightness-[0.92]');
    const skipsWeakTailwindEase = !/(?:^|\s)ease-out(?:\s|$)/.test(classes);

    // Assert
    expect(usesTokenEase).toBe(true);
    expect(usesTokenPressOut).toBe(true);
    expect(usesTokenPressIn).toBe(true);
    expect(usesTokenScale).toBe(true);
    expect(darkensOnPress).toBe(true);
    expect(skipsWeakTailwindEase).toBe(true);
  });

  it('keeps the default fill solid on hover', () => {
    // Arrange
    const classes = buttonVariants({ variant: 'default' });

    // Act
    const fadesFillOnHover = classes.includes('hover:bg-primary/80');

    // Assert
    expect(fadesFillOnHover).toBe(false);
  });

  it('does not scale or dim link-styled buttons', () => {
    // Arrange
    const classes = buttonVariants({ variant: 'link' });

    // Act
    const resetsScale = classes.includes('motion-safe:active:scale-100');
    const resetsBrightness = classes.includes('active:brightness-100');

    // Assert
    expect(resetsScale).toBe(true);
    expect(resetsBrightness).toBe(true);
  });
});
