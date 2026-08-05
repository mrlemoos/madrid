import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TintCircle } from './nota-tint-circle.js';

describe('TintCircle', () => {
  it('applies the given CSS colour to the swatch', () => {
    // Arrange|Act
    const { container } = render(
      <TintCircle colour="oklch(0.55 0.15 250)" aria-label="Blue" />,
    );

    // Assert
    const node = container.firstChild as HTMLElement;
    expect(node.style.backgroundColor).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Blue' })).toBe(node);
  });

  it('honours sizePx', () => {
    // Arrange|Act
    const { container } = render(
      <TintCircle colour="#ff0000" sizePx={20} aria-label="Red" />,
    );

    // Assert
    const node = container.firstChild as HTMLElement;
    expect(node.style.width).toBe('20px');
    expect(node.style.height).toBe('20px');
  });
});
