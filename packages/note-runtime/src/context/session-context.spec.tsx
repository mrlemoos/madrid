import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = {
  current: { isLoaded: true, isSignedIn: true, userId: 'user-1' },
};
const clerkUser = {
  current: {
    primaryEmailAddress: { emailAddress: 'ada@example.com' },
    emailAddresses: [{ emailAddress: 'ada@example.com' }],
  } as unknown,
};

vi.mock('@clerk/react', () => ({
  useAuth: () => auth.current,
  useUser: () => ({ user: clerkUser.current }),
}));

const { AppSessionProvider, useAppSession, useRootLoaderData } = await import(
  './session-context'
);

function wrapper({ children }: { children: ReactNode }) {
  return <AppSessionProvider>{children}</AppSessionProvider>;
}

beforeEach(() => {
  auth.current = { isLoaded: true, isSignedIn: true, userId: 'user-1' };
  clerkUser.current = {
    primaryEmailAddress: { emailAddress: 'ada@example.com' },
    emailAddresses: [{ emailAddress: 'ada@example.com' }],
  };
});

describe('useAppSession', () => {
  it('demands a provider rather than guessing at a session', () => {
    // Arrange|Act|Assert
    expect(() => renderHook(() => useAppSession())).toThrow(
      'AppSessionProvider is required',
    );
  });

  it('is loading until Clerk has resolved', () => {
    // Arrange
    auth.current = {
      isLoaded: false,
      isSignedIn: false,
      userId: null as never,
    };

    // Act
    const { result } = renderHook(() => useAppSession(), { wrapper });

    // Assert
    expect(result.current).toEqual({ user: null, loading: true });
  });

  it('has no user once Clerk resolves a signed-out visitor', () => {
    // Arrange
    auth.current = { isLoaded: true, isSignedIn: false, userId: null as never };

    // Act
    const { result } = renderHook(() => useAppSession(), { wrapper });

    // Assert
    expect(result.current).toEqual({ user: null, loading: false });
  });

  it('exposes the signed-in user with their primary email', () => {
    // Arrange|Act
    const { result } = renderHook(() => useAppSession(), { wrapper });

    // Assert
    expect(result.current).toEqual({
      user: { id: 'user-1', email: 'ada@example.com' },
      loading: false,
    });
  });

  it('falls back to the first address when no primary is set', () => {
    // Arrange
    clerkUser.current = {
      primaryEmailAddress: null,
      emailAddresses: [{ emailAddress: 'first@example.com' }],
    };

    // Act
    const { result } = renderHook(() => useAppSession(), { wrapper });

    // Assert
    expect(result.current.user?.email).toBe('first@example.com');
  });

  it('keeps the user with a null email when Clerk has none', () => {
    // Arrange
    clerkUser.current = { primaryEmailAddress: null, emailAddresses: [] };

    // Act
    const { result } = renderHook(() => useAppSession(), { wrapper });

    // Assert
    expect(result.current.user).toEqual({ id: 'user-1', email: null });
  });
});

describe('useRootLoaderData', () => {
  it('narrows the session down to the user', () => {
    // Arrange|Act
    const { result } = renderHook(() => useRootLoaderData(), { wrapper });

    // Assert
    expect(result.current).toEqual({
      user: { id: 'user-1', email: 'ada@example.com' },
    });
  });
});
