import { describe, expect, it } from 'vitest';
import { isSpaPathnameAllowed } from './pathname-policy';

describe('isSpaPathnameAllowed', () => {
  it('allows the SPA document and static prefixes', () => {
    // Arrange
    const allowedPaths = [
      '/',
      '/index.html',
      '/favicon.svg',
      '/assets/main-abc123.js',
      '/notes',
      '/notes/any',
      '/notes/',
    ];

    // Act
    const results = allowedPaths.map((p) => isSpaPathnameAllowed(p));

    // Assert
    expect(results.every(Boolean)).toBe(true);
  });

  it('rejects unknown pathnames', () => {
    // Arrange
    const rejectedPaths = ['/typo', '/blog/post', '/api'];

    // Act
    const results = rejectedPaths.map((p) => isSpaPathnameAllowed(p));

    // Assert
    expect(results.every((allowed) => !allowed)).toBe(true);
  });
});
