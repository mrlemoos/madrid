import { describe, expect, it } from 'vitest';
import { NOTA_SIDEBAR_SLIDE_PX } from './nota-motion';
import {
  getNotaSidebarClipLayout,
  getNotaSidebarRailMotionTargets,
} from './nota-sidebar-shell-motion';

describe('getNotaSidebarClipLayout', () => {
  it('allocates the stored width when the sidebar is open', () => {
    // Arrange
    const widthPx = 320;

    // Act
    const layout = getNotaSidebarClipLayout({ open: true, widthPx });

    // Assert
    expect(layout).toEqual({ width: 320, maxWidth: 320 });
  });

  it('collapses the clip when the sidebar is closed', () => {
    // Arrange
    const widthPx = 288;

    // Act
    const layout = getNotaSidebarClipLayout({ open: false, widthPx });

    // Assert
    expect(layout).toEqual({ width: 0, maxWidth: 'none' });
  });
});

describe('getNotaSidebarRailMotionTargets', () => {
  it('returns opaque and aligned when the sidebar is open', () => {
    // Act
    const targets = getNotaSidebarRailMotionTargets({
      open: true,
      prefersReducedMotion: false,
    });

    // Assert
    expect(targets).toEqual({ opacity: 1, x: 0 });
    expect(targets).not.toHaveProperty('width');
  });

  it('slides left and fades out when the sidebar is closed', () => {
    // Act
    const targets = getNotaSidebarRailMotionTargets({
      open: false,
      prefersReducedMotion: false,
    });

    // Assert
    expect(targets).toEqual({
      opacity: 0,
      x: -NOTA_SIDEBAR_SLIDE_PX,
    });
    expect(targets).not.toHaveProperty('width');
  });

  it('omits horizontal slide when reduced motion is preferred', () => {
    // Act
    const closed = getNotaSidebarRailMotionTargets({
      open: false,
      prefersReducedMotion: true,
    });
    const open = getNotaSidebarRailMotionTargets({
      open: true,
      prefersReducedMotion: true,
    });

    // Assert
    expect(closed.x).toBe(0);
    expect(open.x).toBe(0);
  });
});
