import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SignUpHeader from './page';

describe('SignUpHeader', () => {
  it('titles the card for creating an account', () => {
    // Arrange|Act
    render(<SignUpHeader />);

    // Assert
    expect(screen.getByText('Sign up')).toBeTruthy();
    expect(
      screen.getByText('Enter your email to create an account.'),
    ).toBeTruthy();
  });
});
