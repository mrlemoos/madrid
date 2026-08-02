import { describe, expect, it } from 'vitest';
import { noteBannerNoteSurfaceClass } from './note-banner-chrome';

describe('note banner chrome', () => {
  it('uses a mostly solid note surface without backdrop blur', () => {
    // Arrange
    const surface = noteBannerNoteSurfaceClass;

    // Act & Assert
    expect(surface).toContain('bg-background/96');
    expect(surface).toContain('dark:bg-background/90');
    expect(surface).not.toContain('backdrop-blur');
    expect(surface).not.toContain('backdrop-saturate');
  });
});
