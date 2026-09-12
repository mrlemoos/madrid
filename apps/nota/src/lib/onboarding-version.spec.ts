import { describe, expect, it } from 'vitest';

import { CURRENT_ONBOARDING_VERSION } from './onboarding-version';

describe('CURRENT_ONBOARDING_VERSION', () => {
  it('identifies the current onboarding flow', () => {
    // Arrange|Act|Assert
    expect(CURRENT_ONBOARDING_VERSION).toBe(3);
  });
});
