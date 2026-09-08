import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SignInFooter from './page';

describe('SignInFooter', () => {
  it('offers the reader the other door', () => {
    // Arrange|Act
    render(<SignInFooter />);

    // Assert
    expect(screen.getByText(/Don't have an account\?/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Sign up' }).getAttribute('href'),
    ).toBe('/signup');
  });
});
