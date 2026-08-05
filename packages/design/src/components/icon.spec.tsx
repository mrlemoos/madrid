import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NOTA_ICONS, NotaIcon } from './icon.js';

describe('NotaIcon', () => {
  it('renders the named icon with size and className', () => {
    // Arrange|Act
    const { container } = render(
      <NotaIcon
        name="arrow-narrow-right"
        size={16}
        className="text-muted-foreground"
        strokeWidth={1.5}
      />,
    );

    // Assert
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.closest('span')?.getAttribute('class')).toContain(
      'text-muted-foreground',
    );
  });

  it('passes span attributes to the wrapper, not the icon root', () => {
    // Arrange|Act
    render(<NotaIcon name="trash" data-testid="trash-wrapper" />);

    // Assert
    const wrapper = screen.getByTestId('trash-wrapper');
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.querySelector('svg')).not.toBeNull();
  });

  it('resolves every registered name to a renderable icon', () => {
    // Arrange
    const names = Object.keys(NOTA_ICONS) as (keyof typeof NOTA_ICONS)[];

    // Act|Assert
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const { container, unmount } = render(<NotaIcon name={name} />);
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });
});
