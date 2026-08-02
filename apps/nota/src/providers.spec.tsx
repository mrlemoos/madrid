import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { clerkFullNotesUrl } from '@nota/app-navigation-core/clerk-hash';
import { AppProviders } from './providers';

const viteEnvStringMock = vi.hoisted(() =>
  vi.fn((key: string): string | undefined => {
    if (key === 'VITE_CLERK_PUBLISHABLE_KEY') {
      return 'pk_test_placeholder';
    }
    if (key === 'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN') {
      return 'ph_test_token';
    }
    return undefined;
  }),
);

const clerkProviderProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

vi.mock('./lib/vite-env', () => ({
  viteEnvString: (key: string) => viteEnvStringMock(key),
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

vi.mock('@nota/note-runtime/clerk-supabase-bridge', () => ({
  ClerkSupabaseBridge: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('./components/clerk-sso-callback-route', () => ({
  ClerkSsoCallbackRoute: () => <div data-testid="clerk-sso-callback-route" />,
}));

vi.mock('@nota/web-design/theme', () => ({
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

vi.mock('@nota/note-runtime/session-context', () => ({
  AppSessionProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-session-provider">{children}</div>
  ),
}));

vi.mock('@nota/note-runtime/sticky-doc-title', () => ({
  StickyDocTitleProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="sticky-doc-title-provider">{children}</div>
  ),
}));

vi.mock('@nota/editor', () => ({
  NoteEditorCommandsProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="note-editor-commands-provider">{children}</div>
  ),
}));

vi.mock('./components/app-error-boundary', () => ({
  AppErrorBoundary: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-error-boundary">{children}</div>
  ),
}));

describe('AppProviders', () => {
  beforeEach(() => {
    clerkProviderProps.current = null;
    viteEnvStringMock.mockImplementation((key: string) => {
      if (key === 'VITE_CLERK_PUBLISHABLE_KEY') {
        return 'pk_test_placeholder';
      }
      if (key === 'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN') {
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
    // (default env mock supplies Clerk key)

    // Act
    render(
      <AppProviders>
        <span>Nota child</span>
      </AppProviders>,
    );

    // Assert
    expect(screen.getByText('Nota child')).toBeTruthy();
    expect(screen.getByTestId('clerk-provider')).toBeTruthy();
    expect(screen.getByTestId('posthog-root')).toBeTruthy();
    expect(screen.getByTestId('theme-provider')).toBeTruthy();
    expect(screen.getByTestId('app-session-provider')).toBeTruthy();
    expect(screen.getByTestId('sticky-doc-title-provider')).toBeTruthy();
    expect(screen.getByTestId('note-editor-commands-provider')).toBeTruthy();
    expect(screen.getByTestId('app-error-boundary')).toBeTruthy();
    expect(screen.getByTestId('clerk-sso-callback-route')).toBeTruthy();
  });

  it('throws when VITE_CLERK_PUBLISHABLE_KEY is missing', async () => {
    // Arrange
    viteEnvStringMock.mockImplementation((key: string) => {
      if (key === 'VITE_CLERK_PUBLISHABLE_KEY') {
        return undefined;
      }
      if (key === 'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN') {
        return 'ph_test_token';
      }
      return undefined;
    });
    vi.resetModules();
    const { AppProviders: AppProvidersWithoutKey } = await import(
      './providers'
    );

    // Act
    const renderWithoutKey = () =>
      render(
        <AppProvidersWithoutKey>
          <span>child</span>
        </AppProvidersWithoutKey>,
      );

    // Assert
    expect(renderWithoutKey).toThrow('Missing VITE_CLERK_PUBLISHABLE_KEY');
  });

  it('configures ClerkProvider for hash routing and Mac deep links', () => {
    // Arrange
    const origin = window.location.origin;

    // Act
    render(
      <AppProviders>
        <span>child</span>
      </AppProviders>,
    );

    // Assert
    expect(clerkProviderProps.current).toMatchObject({
      ui: 'mock-clerk-ui',
      publishableKey: 'pk_test_placeholder',
      signInUrl: `${origin}/sign-in`,
      signUpUrl: `${origin}/sign-up`,
      signInForceRedirectUrl: clerkFullNotesUrl(),
      signUpForceRedirectUrl: clerkFullNotesUrl(),
      allowedRedirectProtocols: ['nota:'],
    });
    expect(clerkProviderProps.current?.routerPush).toBeTypeOf('function');
    expect(clerkProviderProps.current?.routerReplace).toBeTypeOf('function');
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
