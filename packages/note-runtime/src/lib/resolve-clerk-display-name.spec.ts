import { describe, expect, it } from 'vitest';
import { resolveClerkDisplayName } from './use-sync-user-preferences.js';

describe('resolveClerkDisplayName', () => {
  it('prefers fullName when present', () => {
    // Arrange
    const user = {
      fullName: 'Ada Lovelace',
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
    };
    // Act
    const name = resolveClerkDisplayName(user);
    // Assert
    expect(name).toBe('Ada Lovelace');
  });

  it('falls back to first+last when fullName is blank', () => {
    // Arrange
    const user = {
      fullName: '  ',
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
    };
    // Act
    const name = resolveClerkDisplayName(user);
    // Assert
    expect(name).toBe('Ada Lovelace');
  });

  it('falls back to username when no name parts', () => {
    // Arrange
    const user = {
      fullName: null,
      firstName: null,
      lastName: null,
      username: 'ada',
    };
    // Act
    const name = resolveClerkDisplayName(user);
    // Assert
    expect(name).toBe('ada');
  });

  it('returns null when nothing usable is set', () => {
    // Arrange
    const user = { fullName: '', firstName: ' ', lastName: null, username: '' };
    // Act
    const name = resolveClerkDisplayName(user);
    // Assert
    expect(name).toBeNull();
  });

  it('returns null for missing user', () => {
    // Arrange / Act / Assert
    expect(resolveClerkDisplayName(null)).toBeNull();
    expect(resolveClerkDisplayName(undefined)).toBeNull();
  });
});
