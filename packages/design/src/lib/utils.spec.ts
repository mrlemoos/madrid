import { describe, expect, it } from 'vitest';

import { cn } from './utils.js';

describe('cn', () => {
  it('joins conditional class values and drops the falsy ones', () => {
    // Arrange
    const isActive = false;

    // Act
    const result = cn('px-2', isActive && 'bg-muted', ['py-1'], {
      hidden: false,
    });

    // Assert
    expect(result).toBe('px-2 py-1');
  });

  it('lets a later Tailwind utility win over an earlier one in the same group', () => {
    // Arrange|Act
    const result = cn('px-2 text-sm', 'px-4');

    // Assert — tailwind-merge keeps one padding utility, not both
    expect(result).toBe('text-sm px-4');
  });

  it('returns an empty string when nothing resolves', () => {
    // Arrange|Act|Assert
    expect(cn(undefined, null, false, '')).toBe('');
  });
});
