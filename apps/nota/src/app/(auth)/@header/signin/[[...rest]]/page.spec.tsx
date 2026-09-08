import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SignInHeader from './page';

describe('SignInHeader', () => {
  it('titles the card for signing in', () => {
    // Arrange|Act
    render(<SignInHeader />);

    // Assert
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('Enter your email to sign in.')).toBeTruthy();
  });
});
