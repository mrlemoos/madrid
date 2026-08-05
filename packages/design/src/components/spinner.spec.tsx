import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingStatus, Spinner } from './spinner.js';

describe('Spinner', () => {
  it('renders a decorative spinning ring (paired with copy elsewhere)', () => {
    // Arrange|Act
    const { container } = render(<Spinner />);

    // Assert
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});

describe('LoadingStatus', () => {
  it('exposes a polite status region with a visible label', () => {
    // Arrange|Act
    render(<LoadingStatus label="Loading graph…" />);

    // Assert
    const region = screen.getByRole('status');
    expect(region.textContent).toContain('Loading graph');
  });
});
