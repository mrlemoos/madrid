import { describe, expect, it } from 'vitest';
import { createUserRateLimiter } from './user-rate-limit.server';

let rateLimitSpecKey = 0;

describe('createUserRateLimiter', () => {
  it('allows up to max hits inside the window', () => {
    // Arrange
    const limit = createUserRateLimiter({
      key: `test-${++rateLimitSpecKey}`,
      max: 2,
      windowMs: 10_000,
    });
    const userId = 'user-a';

    // Act
    const first = limit(userId);
    const second = limit(userId);
    const third = limit(userId);

    // Assert
    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(third).toBe(false);
  });

  it('tracks users independently', () => {
    // Arrange
    const limit = createUserRateLimiter({
      key: `test-${++rateLimitSpecKey}`,
      max: 1,
      windowMs: 10_000,
    });

    // Act
    const u1First = limit('u1');
    const u1Second = limit('u1');
    const u2First = limit('u2');

    // Assert
    expect(u1First).toBe(true);
    expect(u1Second).toBe(false);
    expect(u2First).toBe(true);
  });
});
