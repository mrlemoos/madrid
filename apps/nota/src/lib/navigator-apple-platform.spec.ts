import { afterEach, describe, expect, it, vi } from 'vitest';

import { navigatorLooksLikeApplePlatform } from './navigator-apple-platform';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('navigatorLooksLikeApplePlatform', () => {
  it('recognises Apple hardware from the user agent', () => {
    // Arrange
    const agents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)',
      'Mozilla/5.0 (iPod touch; CPU iPhone OS 18_0 like Mac OS X)',
    ];

    // Act|Assert — `navigator.platform` is deprecated, so this reads the UA
    for (const userAgent of agents) {
      vi.stubGlobal('navigator', { userAgent });
      expect(navigatorLooksLikeApplePlatform()).toBe(true);
    }
  });

  it('is false on other hardware', () => {
    // Arrange
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    // Act|Assert
    expect(navigatorLooksLikeApplePlatform()).toBe(false);
  });

  it('is false during a server render, where there is no navigator', () => {
    // Arrange
    vi.stubGlobal('navigator', undefined);

    // Act|Assert
    expect(navigatorLooksLikeApplePlatform()).toBe(false);
  });
});
