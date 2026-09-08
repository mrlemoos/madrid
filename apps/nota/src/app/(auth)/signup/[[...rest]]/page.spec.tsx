import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = { current: { isLoaded: true, userId: null as string | null } };

vi.mock('@clerk/react', () => ({ useAuth: () => auth.current }));
vi.mock('@/components/nota-clerk-auth', () => ({
  NotaClerkSignUp: () => <div data-testid="clerk-sign-up" />,
}));

const { default: SignUpPage } = await import('./page');

beforeEach(() => {
  auth.current = { isLoaded: true, userId: null };
});

describe('SignUpPage', () => {
  it('waits for Clerk rather than flashing the form', () => {
    // Arrange
    auth.current = { isLoaded: false, userId: null };

    // Act
    render(<SignUpPage />);

    // Assert
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByTestId('clerk-sign-up')).toBeNull();
  });

  it('shows the form to a signed-out visitor', () => {
    // Arrange|Act
    render(<SignUpPage />);

    // Assert
    expect(screen.getByTestId('clerk-sign-up')).toBeTruthy();
  });

  it('says it is opening the app to someone already signed in', () => {
    // Arrange
    auth.current = { isLoaded: true, userId: 'user-1' };

    // Act
    render(<SignUpPage />);

    // Assert
    expect(screen.getByText('Opening Madrid…')).toBeTruthy();
    expect(screen.queryByTestId('clerk-sign-up')).toBeNull();
  });
});
