import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readNotaServerEntitledSession,
  syncNotaServerEntitledSession,
} from './nota-pro-entitled-session';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('nota pro entitled session mirror', () => {
  it('reads back the entitlement the last server check wrote', () => {
    // Arrange|Act
    syncNotaServerEntitledSession(true);

    // Assert
    expect(readNotaServerEntitledSession()).toBe(true);
  });

  it('reads false once the server says the subscription lapsed', () => {
    // Arrange
    syncNotaServerEntitledSession(true);

    // Act
    syncNotaServerEntitledSession(false);

    // Assert
    expect(readNotaServerEntitledSession()).toBe(false);
  });

  it('is not entitled before any check has run', () => {
    // Arrange|Act|Assert — a fresh tab must not assume Pro
    expect(readNotaServerEntitledSession()).toBe(false);
  });

  it('stays quiet when storage throws, as it does in private mode', () => {
    // Arrange
    vi.stubGlobal('sessionStorage', {
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      getItem: () => {
        throw new Error('SecurityError');
      },
    });

    // Act|Assert
    expect(() => {
      syncNotaServerEntitledSession(true);
    }).not.toThrow();
    expect(readNotaServerEntitledSession()).toBe(false);
  });
});
