import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/landing-page', () => ({
  LandingPage: () => <div data-testid="landing" />,
}));

const { default: LandingRoute } = await import('./page');

describe('LandingRoute', () => {
  it('renders the landing page with no auth gating of its own', () => {
    // Arrange|Act — the proxy already redirected any signed-in visitor
    render(<LandingRoute />);

    // Assert
    expect(screen.getByTestId('landing')).toBeTruthy();
  });
});
