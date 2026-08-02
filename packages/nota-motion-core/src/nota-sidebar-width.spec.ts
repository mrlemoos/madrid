import { describe, expect, it } from 'vitest';
import {
  clampNotaSidebarWidthPx,
  NOTA_SIDEBAR_DEFAULT_WIDTH_PX,
  NOTA_SIDEBAR_MAX_WIDTH_PX,
  NOTA_SIDEBAR_MIN_WIDTH_PX,
} from './nota-sidebar-width';

describe('nota-sidebar-width', () => {
  it('clamps widths to the sidebar band', () => {
    // Arrange
    const below = NOTA_SIDEBAR_MIN_WIDTH_PX - 40;
    const above = NOTA_SIDEBAR_MAX_WIDTH_PX + 80;
    const mid = 320.6;

    // Act + Assert
    expect(clampNotaSidebarWidthPx(below)).toBe(NOTA_SIDEBAR_MIN_WIDTH_PX);
    expect(clampNotaSidebarWidthPx(above)).toBe(NOTA_SIDEBAR_MAX_WIDTH_PX);
    expect(clampNotaSidebarWidthPx(mid)).toBe(321);
  });

  it('falls back to the default width for non-finite values', () => {
    // Arrange + Act + Assert
    expect(clampNotaSidebarWidthPx(Number.NaN)).toBe(
      NOTA_SIDEBAR_DEFAULT_WIDTH_PX,
    );
    expect(clampNotaSidebarWidthPx(Number.POSITIVE_INFINITY)).toBe(
      NOTA_SIDEBAR_DEFAULT_WIDTH_PX,
    );
  });
});
