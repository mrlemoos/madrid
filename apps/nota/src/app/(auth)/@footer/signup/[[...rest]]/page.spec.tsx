import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SignUpFooter from './page';

describe('SignUpFooter', () => {
  it('offers the reader the other door', () => {
    // Arrange|Act
    render(<SignUpFooter />);

    // Assert
    expect(screen.getByText(/Already have an account\?/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Sign in' }).getAttribute('href'),
    ).toBe('/signin');
  });
});
