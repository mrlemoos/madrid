import { describe, expect, it } from 'vitest';
import {
  NOTA_SIDEBAR_MAX_WIDTH_PX,
  NOTA_SIDEBAR_MIN_WIDTH_PX,
} from './nota-sidebar-width';
import {
  computeSidebarResizeLiveWidth,
  resolveSidebarResizeSettle,
} from './nota-sidebar-resize-settle';
import { rubberband } from './nota-rubberband';

describe('computeSidebarResizeLiveWidth', () => {
  it('tracks 1:1 inside the clamp band', () => {
    // Arrange
    const startWidthPx = 300;
    const deltaPx = 40;

    // Act
    const live = computeSidebarResizeLiveWidth({
      startWidthPx,
      deltaPx,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    // Assert
    expect(live).toBe(340);
  });

  it('rubberbands past the maximum instead of hard-clamping', () => {
    // Arrange
    const startWidthPx = NOTA_SIDEBAR_MAX_WIDTH_PX;
    const deltaPx = 80;
    const dimension = NOTA_SIDEBAR_MAX_WIDTH_PX - NOTA_SIDEBAR_MIN_WIDTH_PX;

    // Act
    const live = computeSidebarResizeLiveWidth({
      startWidthPx,
      deltaPx,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    // Assert
    expect(live).toBeGreaterThan(NOTA_SIDEBAR_MAX_WIDTH_PX);
    expect(live).toBeLessThan(startWidthPx + deltaPx);
    expect(live).toBeCloseTo(
      NOTA_SIDEBAR_MAX_WIDTH_PX + rubberband(deltaPx, dimension),
      10,
    );
  });
});

describe('resolveSidebarResizeSettle', () => {
  it('settles past-max rubberband width to the clamped maximum', () => {
    // Arrange
    const widthPx = NOTA_SIDEBAR_MAX_WIDTH_PX + 40;
    const velocityPxPerSec = 120;

    // Act
    const settle = resolveSidebarResizeSettle({
      widthPx,
      velocityPxPerSec,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    // Assert — release must not keep the raw overshoot
    expect(settle.targetWidthPx).toBe(NOTA_SIDEBAR_MAX_WIDTH_PX);
    expect(settle.initialVelocityPxPerSec).toBe(velocityPxPerSec);
  });

  it('settles past-min rubberband width to the clamped minimum', () => {
    // Arrange
    const widthPx = NOTA_SIDEBAR_MIN_WIDTH_PX - 50;
    const velocityPxPerSec = -80;

    // Act
    const settle = resolveSidebarResizeSettle({
      widthPx,
      velocityPxPerSec,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    // Assert
    expect(settle.targetWidthPx).toBe(NOTA_SIDEBAR_MIN_WIDTH_PX);
    expect(settle.initialVelocityPxPerSec).toBe(velocityPxPerSec);
  });

  it('projects in-band momentum then clamps the settle target', () => {
    // Arrange — near the max, flicking outward should still clamp
    const widthPx = NOTA_SIDEBAR_MAX_WIDTH_PX - 10;
    const velocityPxPerSec = 600;

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

  it('keeps an in-band rest position when velocity is negligible', () => {
    // Arrange
    const widthPx = 320;
    const velocityPxPerSec = 5;

    // Act
    const settle = resolveSidebarResizeSettle({
      widthPx,
      velocityPxPerSec,
      minPx: NOTA_SIDEBAR_MIN_WIDTH_PX,
      maxPx: NOTA_SIDEBAR_MAX_WIDTH_PX,
    });

    // Assert
    expect(settle.targetWidthPx).toBe(320);
  });
});
