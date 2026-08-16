import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotaLogo } from './nota-logo';

describe('NotaLogo', () => {
  it('draws a currentColor geometric N, not a note stack', () => {
    // Arrange
    const ui = <NotaLogo />;

    // Act
    const { container } = render(ui);
    const lines = container.querySelectorAll('line');
    const strokeGroup = container.querySelector('g');
    const sheets = container.querySelectorAll('rect');

    // Assert
    expect(lines).toHaveLength(3);
    expect(strokeGroup?.getAttribute('stroke')).toBe('currentColor');
    expect(sheets).toHaveLength(0);
  });
});
