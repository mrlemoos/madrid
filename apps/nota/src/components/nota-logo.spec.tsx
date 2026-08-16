import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotaLogo } from './nota-logo';

describe('NotaLogo', () => {
  it('draws a currentColor geometric N, not a note stack', () => {
    // Arrange
    const ui = <NotaLogo />;

    // Act
    const { container } = render(ui);
    const path = container.querySelector('path');
    const sheets = container.querySelectorAll('rect');

    // Assert
    expect(path).not.toBeNull();
    expect(path?.getAttribute('fill')).toBe('currentColor');
    expect(path?.getAttribute('stroke')).toBeNull();
    expect(path?.getAttribute('stroke-linecap')).toBeNull();
    expect(sheets).toHaveLength(0);
  });
});
