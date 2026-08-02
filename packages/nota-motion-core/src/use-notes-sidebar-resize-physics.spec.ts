import { describe, expect, it } from 'vitest';
import {
  NOTA_SIDEBAR_MAX_WIDTH_PX,
  NOTA_SIDEBAR_MIN_WIDTH_PX,
} from './nota-sidebar-width';
import {
  computeSidebarResizeLiveWidth,
  resolveSidebarResizeSettle,
} from './nota-sidebar-resize-settle';

/**
 * Contract specs for the resize hook's physics seam
 * (`use-notes-sidebar-resize` → live rubberband + settle-to-clamp).
 */
describe('use-notes-sidebar-resize physics', () => {
  it('uses rubberband live widths past the clamp during drag', () => {
    // Arrange
    const startWidthPx = NOTA_SIDEBAR_MAX_WIDTH_PX;
    const deltaPx = 60;

    // Act
    const live = computeSidebarResizeLiveWidth({
      startWidthPx,
      deltaPx,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    // Assert
    expect(live).toBeGreaterThan(NOTA_SIDEBAR_MAX_WIDTH_PX);
  });

  it('settles release velocity to a clamped stored width', () => {
    // Arrange
    const widthPx = NOTA_SIDEBAR_MAX_WIDTH_PX + 35;
    const velocityPxPerSec = 200;

    // Act
    const settle = resolveSidebarResizeSettle({
      widthPx,
      velocityPxPerSec,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    // Assert
    expect(settle.targetWidthPx).toBe(NOTA_SIDEBAR_MAX_WIDTH_PX);
    expect(settle.initialVelocityPxPerSec).toBe(velocityPxPerSec);
  });
});
