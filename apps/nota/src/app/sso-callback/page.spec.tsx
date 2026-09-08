import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const callbackProps = { current: null as Record<string, unknown> | null };

vi.mock('@clerk/react', () => ({
  AuthenticateWithRedirectCallback: (props: Record<string, unknown>) => {
    callbackProps.current = props;
    return <div data-testid="clerk-callback" />;
  },
}));

const { default: SsoCallbackPage } = await import('./page');

describe('SsoCallbackPage', () => {
  it('shows a signing-in frame rather than a blank screen', () => {
    // Arrange|Act
    render(<SsoCallbackPage />);

    // Assert
    expect(screen.getByText('Signing you in…')).toBeTruthy();
  });

  it('mounts the captcha target Clerk needs', () => {
    // Arrange|Act
    const { container } = render(<SsoCallbackPage />);

    // Assert
    expect(container.querySelector('#clerk-captcha')).not.toBeNull();
  });

  it('points Clerk back at our own auth routes', () => {
    // Arrange|Act
    render(<SsoCallbackPage />);

    // Assert
    expect(screen.getByTestId('clerk-callback')).toBeTruthy();
    expect(callbackProps.current).toMatchObject({
      signInUrl: '/signin',
      signUpUrl: '/signup',
    });
  });
});
