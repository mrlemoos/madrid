import { describe, expect, it } from 'vitest';
import { createTypewriterScrollUserGuard } from './nota-typewriter-scroll-guard';

describe('createTypewriterScrollUserGuard', () => {
  it('sets skip after user scrolls the scroll root', () => {
    // Arrange
    const guard = createTypewriterScrollUserGuard();

    // Act
    guard.onScrollRootScroll();

    // Assert
    expect(guard.shouldSkipTypewriterAlign()).toBe(true);
  });

  it('does not set skip when scroll follows beforeProgrammaticScroll', () => {
    // Arrange
    const guard = createTypewriterScrollUserGuard();

    // Act
    guard.beforeProgrammaticScroll();
    guard.onScrollRootScroll();

    // Assert
    expect(guard.shouldSkipTypewriterAlign()).toBe(false);
  });

  it('clears skip after editor user gesture', () => {
    // Arrange
    const guard = createTypewriterScrollUserGuard();
    guard.onScrollRootScroll();
    expect(guard.shouldSkipTypewriterAlign()).toBe(true);

    // Act
    guard.onEditorUserGesture();

    // Assert
    expect(guard.shouldSkipTypewriterAlign()).toBe(false);
  });

  it('reset clears override and suppress arm', () => {
    // Arrange
    const guard = createTypewriterScrollUserGuard();
    guard.onScrollRootScroll();
    guard.beforeProgrammaticScroll();

    // Act
    guard.reset();

    // Assert
    expect(guard.shouldSkipTypewriterAlign()).toBe(false);
    guard.onScrollRootScroll();
    expect(guard.shouldSkipTypewriterAlign()).toBe(true);
  });
});
