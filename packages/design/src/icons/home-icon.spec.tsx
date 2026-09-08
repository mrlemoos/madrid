import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomeIcon from './home-icon.js';
import type { AnimatedIconHandle } from './types.js';

describe('HomeIcon', () => {
  it('renders one svg sized and coloured by its props', () => {
    // Arrange|Act
    const { container } = render(
      <HomeIcon size={18} color="rebeccapurple" strokeWidth={1.5} />,
    );

    // Assert
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('18');
    expect(svg?.getAttribute('height')).toBe('18');
    expect(svg?.getAttribute('stroke')).toBe('rebeccapurple');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');
  });

  it('falls back to a 24px currentColor icon', () => {
    // Arrange|Act
    const { container } = render(<HomeIcon />);

    // Assert
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('exposes start and stop animation through its ref', () => {
    // Arrange
    const ref = createRef<AnimatedIconHandle>();

    // Act
    render(<HomeIcon ref={ref} />);

    // Assert
    expect(typeof ref.current?.startAnimation).toBe('function');
    expect(typeof ref.current?.stopAnimation).toBe('function');
  });
});
