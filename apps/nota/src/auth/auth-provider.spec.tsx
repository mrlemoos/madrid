import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';

const envMock = vi.hoisted(() =>
  vi.fn((key: string): string | undefined => {
    if (key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') {
      return 'pk_test_placeholder';
    }
    return undefined;
  }),
);

const clerkProviderProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

const routerPush = vi.hoisted(() => vi.fn());
const routerReplace = vi.hoisted(() => vi.fn());

vi.mock('@nota/env-nextjs', () => ({
  env: (key: string) => envMock(key),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@clerk/react', () => ({
  ClerkProvider: (props: Record<string, unknown>) => {
    clerkProviderProps.current = props;
    return (
      <div data-testid="clerk-provider">{props.children as ReactNode}</div>
    );
  },
}));

vi.mock('@clerk/ui', () => ({
  ui: 'mock-clerk-ui',
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    clerkProviderProps.current = null;
    routerPush.mockClear();
    routerReplace.mockClear();
    envMock.mockImplementation((key: string) => {
      if (key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') {
        return 'pk_test_placeholder';
      }
      return undefined;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children inside ClerkProvider', () => {
    // Arrange / Act
    render(
      <AuthProvider>
        <span>auth child</span>
      </AuthProvider>,
    );

    // Assert
    expect(screen.getByText('auth child')).toBeTruthy();
    expect(screen.getByTestId('clerk-provider')).toBeTruthy();
  });

  it('throws when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing', () => {
    // Arrange
    envMock.mockImplementation(() => undefined);

    // Act
    const renderWithoutKey = () =>
      render(
        <AuthProvider>
          <span>child</span>
        </AuthProvider>,
      );

    // Assert
    expect(renderWithoutKey).toThrow(
      'Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    );
  });

  it('configures Clerk for path-routed auth and Mac deep links', () => {
    // Arrange / Act
    render(
      <AuthProvider>
        <span>child</span>
      </AuthProvider>,
    );

    // Assert
    expect(clerkProviderProps.current).toMatchObject({
      ui: 'mock-clerk-ui',
      publishableKey: 'pk_test_placeholder',
      signInUrl: '/signin',
      signUpUrl: '/signup',
      signInForceRedirectUrl: '/notes',
      signUpForceRedirectUrl: '/notes',
      allowedRedirectProtocols: ['nota:'],
    });
    expect(clerkProviderProps.current?.routerPush).toBeTypeOf('function');
    expect(clerkProviderProps.current?.routerReplace).toBeTypeOf('function');
  });

  it('forwards routerPush and routerReplace to the Next router', () => {
    // Arrange
    render(
      <AuthProvider>
        <span>child</span>
      </AuthProvider>,
    );
    const push = clerkProviderProps.current?.routerPush as (to: string) => void;
    const replace = clerkProviderProps.current?.routerReplace as (
      to: string,
    ) => void;

    // Act
    push('/notes');
    replace('/signin');

    // Assert
    expect(routerPush).toHaveBeenCalledWith('/notes');
    expect(routerReplace).toHaveBeenCalledWith('/signin');
  });
});
