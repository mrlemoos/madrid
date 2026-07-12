import { forwardRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AnimatedIconHandle, AnimatedIconProps } from '../icons/types.js';
import { NotaIcon } from './icon.js';

const TestIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  function TestIcon({ size = 24, className, strokeWidth }, ref) {
    return (
      <svg
        ref={ref as never}
        data-testid="test-icon"
        width={size}
        height={size}
        className={className}
        data-stroke-width={strokeWidth}
      />
    );
  },
);

describe('NotaIcon', () => {
  it('renders the icon component with size, className, and strokeWidth', () => {
    // Arrange|Act
    render(
      <NotaIcon
        icon={TestIcon}
        size={16}
        className="text-muted-foreground"
        strokeWidth={1.5}
      />,
    );

    // Assert
    const el = screen.getByTestId('test-icon');
    expect(el.getAttribute('width')).toBe('16');
    expect(el.parentElement?.getAttribute('class')).toContain(
      'text-muted-foreground',
    );
    expect(el.getAttribute('data-stroke-width')).toBe('1.5');
  });
});
