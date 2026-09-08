import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const providerProps = { current: null as Record<string, unknown> | null };

vi.mock('@posthog/react', () => ({
  PostHogProvider: (props: Record<string, unknown>) => {
    providerProps.current = props;
    return <div data-testid="posthog">{props.children as never}</div>;
  },
}));
vi.mock('@getmadrid/env-nextjs', () => ({
  env: (key: string) =>
    key === 'NEXT_PUBLIC_POSTHOG_HOST' ? 'https://eu.i.posthog.com' : undefined,
}));

const { DeferredPostHogRoot } = await import('./deferred-posthog-root');

beforeEach(() => {
  providerProps.current = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DeferredPostHogRoot', () => {
  it('renders the app without PostHog when no key is configured', async () => {
    // Arrange|Act
    render(
      <DeferredPostHogRoot apiKey={undefined}>
        <span>vault</span>
      </DeferredPostHogRoot>,
    );

    // Assert
    expect(screen.getByText('vault')).toBeTruthy();
    await Promise.resolve();
    expect(screen.queryByTestId('posthog')).toBeNull();
  });

  it('paints the app first, then wraps it once PostHog loads', async () => {
    // Arrange|Act
    render(
      <DeferredPostHogRoot apiKey="phc_key">
        <span>vault</span>
      </DeferredPostHogRoot>,
    );

    // Assert — Clerk, theme and fonts stay on the critical path
    expect(screen.getByText('vault')).toBeTruthy();
    expect(screen.queryByTestId('posthog')).toBeNull();
    await waitFor(() => {
      expect(screen.getByTestId('posthog')).toBeTruthy();
    });
    expect(screen.getByText('vault')).toBeTruthy();
  });

  it('passes the key and the configured host through', async () => {
    // Arrange|Act
    render(
      <DeferredPostHogRoot apiKey="phc_key">
        <span>vault</span>
      </DeferredPostHogRoot>,
    );

    // Assert
    await waitFor(() => {
      expect(providerProps.current).not.toBeNull();
    });
    expect(providerProps.current?.apiKey).toBe('phc_key');
    expect(providerProps.current?.options).toMatchObject({
      api_host: 'https://eu.i.posthog.com',
    });
  });

  it('does not load PostHog into a tree that unmounted first', async () => {
    // Arrange
    vi.useFakeTimers();
    const { unmount } = render(
      <DeferredPostHogRoot apiKey="phc_key">
        <span>vault</span>
      </DeferredPostHogRoot>,
    );

    // Act
    unmount();
    vi.advanceTimersByTime(10);
    vi.useRealTimers();
    await Promise.resolve();

    // Assert
    expect(screen.queryByTestId('posthog')).toBeNull();
  });
});
