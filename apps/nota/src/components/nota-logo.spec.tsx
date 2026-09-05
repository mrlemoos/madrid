import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NotaLogo } from './nota-logo';

describe('NotaLogo', () => {
  it('draws the Madrid M beneath its shallow wrought-iron arch', () => {
    // Arrange
    const ui = <NotaLogo />;

    // Act
    const { container } = render(ui);
    const paths = container.querySelectorAll('path');
    const path = paths[0];
    const sheets = container.querySelectorAll('rect');

    // Assert
    expect(path).not.toBeNull();
    expect(path?.getAttribute('fill')).toBe('currentColor');
    expect(path?.getAttribute('stroke')).toBeNull();
    expect(path?.getAttribute('stroke-linecap')).toBeNull();
    expect(paths).toHaveLength(3);
    expect(sheets).toHaveLength(0);
  });
});
