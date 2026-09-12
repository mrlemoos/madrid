import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/react', () => ({ PricingTable: () => <div>Plans</div> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock('@/lib/nota-server-client', () => ({
  postNotaProInvalidate: vi.fn(),
}));
vi.mock('@/lib/use-nota-translator', () => ({
  useNotaTranslator: () => ({ t: (key: string) => key }),
}));

const { OnboardingPaywall } = await import('./onboarding-paywall');

describe('OnboardingPaywall', () => {
  it('explains the paid workspace and renders plans', () => {
    // Arrange|Act
    render(<OnboardingPaywall />);

    // Assert
    expect(screen.getByText('Madrid Pro')).toBeTruthy();
    expect(screen.getByText('Plans')).toBeTruthy();
  });
});
