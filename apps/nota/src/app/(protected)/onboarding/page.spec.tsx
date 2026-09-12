import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getOnboardingVersion: vi.fn(),
  getServerNotaProEntitled: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/server/nota-pro-entitlement', () => ({
  getServerNotaProEntitled: mocks.getServerNotaProEntitled,
}));
vi.mock('@/server/onboarding.server', () => ({
  getOnboardingVersion: mocks.getOnboardingVersion,
}));
vi.mock('@/components/onboarding-paywall', () => ({
  OnboardingPaywall: () => <p>Plans</p>,
}));
vi.mock('@/components/notes-onboarding', () => ({
  NotesOnboarding: () => <p>Questions</p>,
}));

const { default: OnboardingPage } = await import('./page');

describe('OnboardingPage', () => {
  it('renders the paywall for users without a subscription', async () => {
    // Arrange
    mocks.auth.mockResolvedValue({ userId: 'user-1' });
    mocks.getServerNotaProEntitled.mockResolvedValue(false);
    mocks.getOnboardingVersion.mockResolvedValue(null);

    // Act
    const page = await OnboardingPage();

    // Assert
    expect(page.type).toBeDefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it('redirects completed subscribers to notes', async () => {
    // Arrange
    mocks.auth.mockResolvedValue({ userId: 'user-1' });
    mocks.getServerNotaProEntitled.mockResolvedValue(true);
    mocks.getOnboardingVersion.mockResolvedValue(3);

    // Act
    await OnboardingPage();

    // Assert
    expect(mocks.redirect).toHaveBeenCalledWith('/notes');
  });
});
