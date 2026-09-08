import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getClerkAccessToken,
  isClerkAccessTokenGetterRegistered,
  setClerkAccessTokenGetter,
} from './clerk-token-ref';

afterEach(() => {
  setClerkAccessTokenGetter(null);
});

describe('clerk access token ref', () => {
  it('reports no getter before the bridge mounts', () => {
    // Arrange|Act|Assert
    expect(isClerkAccessTokenGetterRegistered()).toBe(false);
  });

  it('hands non-hook modules the token the bridge registered', async () => {
    // Arrange
    setClerkAccessTokenGetter(() => Promise.resolve('jwt-123'));

    // Act
    const token = await getClerkAccessToken();

    // Assert
    expect(isClerkAccessTokenGetterRegistered()).toBe(true);
    expect(token).toBe('jwt-123');
  });

  it('resolves to null when no getter is registered', async () => {
    // Arrange|Act|Assert — callers fall back to cookie auth rather than throwing
    await expect(getClerkAccessToken()).resolves.toBeNull();
  });

  it('swallows a rejecting getter so a signed-out session is not an exception', async () => {
    // Arrange
    setClerkAccessTokenGetter(() => Promise.reject(new Error('no session')));

    // Act|Assert
    await expect(getClerkAccessToken()).resolves.toBeNull();
  });

  it('clears the getter when the bridge unmounts', async () => {
    // Arrange
    setClerkAccessTokenGetter(vi.fn().mockResolvedValue('jwt-123'));

    // Act
    setClerkAccessTokenGetter(null);

    // Assert
    expect(isClerkAccessTokenGetterRegistered()).toBe(false);
    await expect(getClerkAccessToken()).resolves.toBeNull();
  });
});
