import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthScreenHashLink } from './auth-screen-hash-link';

describe('AuthScreenHashLink', () => {
  it('points at the Clerk sign-in route', () => {
    // Arrange|Act
    render(<AuthScreenHashLink target="login">Sign in</AuthScreenHashLink>);

    // Assert — a shallow `history.replaceState` would never navigate
    expect(
      screen.getByRole('link', { name: 'Sign in' }).getAttribute('href'),
    ).toBe('/signin');
  });

  it('points at the Clerk sign-up route', () => {
    // Arrange|Act
    render(
      <AuthScreenHashLink target="signup">Create account</AuthScreenHashLink>,
    );

    // Assert
    expect(
      screen.getByRole('link', { name: 'Create account' }).getAttribute('href'),
    ).toBe('/signup');
  });

  it('runs the caller’s click handler', () => {
    // Arrange
    const onClick = vi.fn();
    render(
      <AuthScreenHashLink target="login" onClick={onClick}>
        Sign in
      </AuthScreenHashLink>,
    );

    // Act
    fireEvent.click(screen.getByRole('link', { name: 'Sign in' }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps the caller’s own class alongside the button styling', () => {
    // Arrange|Act
    render(
      <AuthScreenHashLink target="login" className="mt-4">
        Sign in
      </AuthScreenHashLink>,
    );

    // Assert
    expect(screen.getByRole('link').className).toContain('mt-4');
  });
});
