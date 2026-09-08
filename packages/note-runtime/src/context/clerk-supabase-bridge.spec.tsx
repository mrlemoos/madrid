import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setClerkAccessTokenGetter = vi.fn();
const setSupabaseClerkGetToken = vi.fn();
const auth = {
  current: {
    isLoaded: true,
    getToken: vi.fn().mockResolvedValue('jwt-1'),
  },
};

vi.mock('@clerk/react', () => ({ useAuth: () => auth.current }));
vi.mock('@getmadrid/data-source/clerk-token-ref', () => ({
  setClerkAccessTokenGetter,
}));
vi.mock('@getmadrid/data-source/supabase/browser', () => ({
  setSupabaseClerkGetToken,
}));

const { ClerkSupabaseBridge } = await import('./clerk-supabase-bridge');

beforeEach(() => {
  vi.clearAllMocks();
  auth.current = {
    isLoaded: true,
    getToken: vi.fn().mockResolvedValue('jwt-1'),
  };
});

describe('ClerkSupabaseBridge', () => {
  it('renders its children untouched', () => {
    // Arrange|Act
    const { getByText } = render(
      <ClerkSupabaseBridge>
        <span>vault</span>
      </ClerkSupabaseBridge>,
    );

    // Assert
    expect(getByText('vault')).toBeTruthy();
  });

  it('clears both getters until Clerk has loaded', () => {
    // Arrange
    auth.current = { isLoaded: false, getToken: vi.fn() };

    // Act
    render(<ClerkSupabaseBridge>x</ClerkSupabaseBridge>);

    // Assert — an early Supabase call must fail loudly, not send a stale token
    expect(setSupabaseClerkGetToken).toHaveBeenCalledWith(null);
    expect(setClerkAccessTokenGetter).toHaveBeenCalledWith(null);
  });

  it('registers a getter that reads the current Clerk token', async () => {
    // Arrange|Act
    render(<ClerkSupabaseBridge>x</ClerkSupabaseBridge>);

    // Assert
    const registered = setSupabaseClerkGetToken.mock
      .calls[0]?.[0] as () => Promise<string | null>;
    await expect(registered()).resolves.toBe('jwt-1');
    expect(setClerkAccessTokenGetter).toHaveBeenCalledWith(registered);
  });

  it('keeps the same registration when Clerk swaps getToken identity', () => {
    // Arrange
    const { rerender } = render(<ClerkSupabaseBridge>x</ClerkSupabaseBridge>);
    const first = setSupabaseClerkGetToken.mock.calls[0]?.[0];

    // Act — a new function identity must not tear the Supabase client down
    auth.current = {
      isLoaded: true,
      getToken: vi.fn().mockResolvedValue('jwt-2'),
    };
    rerender(<ClerkSupabaseBridge>x</ClerkSupabaseBridge>);

    // Assert
    expect(setSupabaseClerkGetToken).toHaveBeenCalledTimes(1);
    expect(setSupabaseClerkGetToken.mock.calls[0]?.[0]).toBe(first);
  });

  it('reads the latest token through the stable getter', async () => {
    // Arrange
    const { rerender } = render(<ClerkSupabaseBridge>x</ClerkSupabaseBridge>);
    const registered = setSupabaseClerkGetToken.mock
      .calls[0]?.[0] as () => Promise<string | null>;

    // Act
    auth.current = {
      isLoaded: true,
      getToken: vi.fn().mockResolvedValue('jwt-2'),
    };
    rerender(<ClerkSupabaseBridge>x</ClerkSupabaseBridge>);

    // Assert
    await expect(registered()).resolves.toBe('jwt-2');
  });

  it('unregisters on unmount', () => {
    // Arrange
    const { unmount } = render(<ClerkSupabaseBridge>x</ClerkSupabaseBridge>);

    // Act
    unmount();

    // Assert
    expect(setSupabaseClerkGetToken).toHaveBeenLastCalledWith(null);
    expect(setClerkAccessTokenGetter).toHaveBeenLastCalledWith(null);
  });
});
