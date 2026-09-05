import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AppProviders } from './providers';

const envMock = vi.hoisted(() =>
  vi.fn((key: string): string | undefined => {
    if (key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') {
      return 'pk_test_placeholder';
    }
    if (key === 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN') {
      return 'ph_test_token';
    }
    return undefined;
  }),
);

vi.mock('@getmadrid/env-nextjs', () => ({
  env: (key: string) => envMock(key),
}));

vi.mock('./auth', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock('./components/deferred-posthog-root', () => ({
  DeferredPostHogRoot: ({
    children,
    apiKey,
  }: {
    children: ReactNode;
    apiKey?: string;
  }) => (
    <div data-testid="posthog-root" data-api-key={apiKey ?? ''}>
      {children}
    </div>
  ),
}));

vi.mock('@getmadrid/note-runtime/clerk-supabase-bridge', () => ({
  ClerkSupabaseBridge: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@getmadrid/design/theme', () => ({
  ThemeProvider: ({
    children,
    defaultTheme,
    storageKey,
  }: {
    children: ReactNode;
    defaultTheme: string;
    storageKey: string;
  }) => (
    <div
      data-testid="theme-provider"
      data-default-theme={defaultTheme}
      data-storage-key={storageKey}
    >
      {children}
    </div>
  ),
}));

vi.mock('@getmadrid/note-runtime/session-context', () => ({
  AppSessionProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-session-provider">{children}</div>
  ),
}));

vi.mock('@getmadrid/note-runtime/sticky-doc-title', () => ({
  StickyDocTitleProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="sticky-doc-title-provider">{children}</div>
  ),
}));

vi.mock('@getmadrid/editor', () => ({
  NoteEditorCommandsProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="note-editor-commands-provider">{children}</div>
  ),
}));

vi.mock('@getmadrid/error-boundary/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

describe('AppProviders', () => {
  beforeEach(() => {
    envMock.mockImplementation((key: string) => {
      if (key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') {
        return 'pk_test_placeholder';
      }
      if (key === 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN') {
        return 'ph_test_token';
      }
      return undefined;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children inside the provider stack', () => {
    // Arrange
    // (AuthProvider stub + default env mock)

    // Act
    render(
      <AppProviders>
        <span>Madrid child</span>
      </AppProviders>,
    );

    // Assert
    expect(screen.getByText('Madrid child')).toBeTruthy();
    expect(screen.getByTestId('auth-provider')).toBeTruthy();
    expect(screen.getByTestId('posthog-root')).toBeTruthy();
    expect(screen.getByTestId('theme-provider')).toBeTruthy();
    expect(screen.getByTestId('app-session-provider')).toBeTruthy();
    expect(screen.getByTestId('sticky-doc-title-provider')).toBeTruthy();
    expect(screen.getByTestId('note-editor-commands-provider')).toBeTruthy();
    expect(screen.getByTestId('error-boundary')).toBeTruthy();
  });

  it('passes PostHog token and theme defaults through the stack', () => {
    // Act
    render(
      <AppProviders>
        <span>child</span>
      </AppProviders>,
    );

    // Assert
    expect(
      screen.getByTestId('posthog-root').getAttribute('data-api-key'),
    ).toBe('ph_test_token');
    expect(
      screen.getByTestId('theme-provider').getAttribute('data-default-theme'),
    ).toBe('system');
    expect(
      screen.getByTestId('theme-provider').getAttribute('data-storage-key'),
    ).toBe('nota-ui-theme');
  });
});
