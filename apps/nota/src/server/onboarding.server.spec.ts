import { describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock('./supabase-service.server', () => ({
  requireServiceSupabase: () => ({ from }),
}));
vi.mock('server-only', () => ({}));

const { getOnboardingVersion } = await import('./onboarding.server');

describe('getOnboardingVersion', () => {
  it('returns the saved version for the signed-in user', async () => {
    // Arrange
    maybeSingle.mockResolvedValue({
      data: { onboarding_version: 3 },
      error: null,
    });

    // Act
    const version = await getOnboardingVersion('user-1');

    // Assert
    expect(version).toBe(3);
    expect(from).toHaveBeenCalledWith('user_preferences');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
