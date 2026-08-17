import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CartoonLandscape } from './cartoon-landscape';

describe('CartoonLandscape', () => {
  it('paints the Welcome Landscape in colour, not greyscale', () => {
    // Arrange
    const ui = <CartoonLandscape />;

    // Act
    const { container } = render(ui);
    const img = container.querySelector('img');

    // Assert
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/nota-landscape.png');
    expect(img?.className.split(/\s+/)).not.toContain('grayscale');
  });
});
