import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotFoundScreen } from './not-found-screen';

describe('NotFoundScreen', () => {
  it('names the page for assistive tech', () => {
    // Arrange|Act
    render(<NotFoundScreen signedIn={false} />);

    // Assert
    expect(
      screen.getByRole('main', { name: 'Lost in the margin' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Lost in the margin' }),
    ).toBeTruthy();
  });

  it('sends a signed-out visitor home', () => {
    // Arrange|Act
    render(<NotFoundScreen signedIn={false} />);

    // Assert
    const link = screen.getByRole('link', { name: /Return home/ });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('sends a signed-in reader back to their notes', () => {
    // Arrange|Act
    render(<NotFoundScreen signedIn />);

    // Assert
    const link = screen.getByRole('link', { name: /Back to notes/ });
    expect(link.getAttribute('href')).toBe('/notes');
  });

  it('hides the decorative numeral and glows from screen readers', () => {
    // Arrange|Act
    const { container } = render(<NotFoundScreen signedIn={false} />);

    // Assert
    const numeral = screen.getByText('404');
    expect(numeral.closest('[aria-hidden]')).not.toBeNull();
    expect(container.querySelectorAll('[aria-hidden]').length).toBeGreaterThan(
      1,
    );
  });
});
