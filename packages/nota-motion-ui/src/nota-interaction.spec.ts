import { describe, expect, it } from 'vitest';
import {
  NOTA_PRESS_IN_MS,
  NOTA_PRESS_OUT_MS,
  NOTA_PRESS_SCALE,
} from '@getmadrid/design/motion-tokens';

import {
  NOTA_CHROME_NAV_ITEM_CLASS,
  NOTA_CMDK_ITEM_CLASS,
  NOTA_PRESSABLE_CLASS,
  NOTA_PRESS_IN_MS as reexportedPressIn,
  NOTA_PRESS_OUT_MS as reexportedPressOut,
  NOTA_PRESS_SCALE as reexportedPressScale,
  NOTA_SAVE_PULSE_CLASS,
  NOTA_SIDEBAR_ROW_CLASS,
} from './nota-interaction';

describe('nota interaction class tokens', () => {
  it('gives every surface its own stable hook', () => {
    // Arrange
    const tokens = [
      NOTA_PRESSABLE_CLASS,
      NOTA_CHROME_NAV_ITEM_CLASS,
      NOTA_SIDEBAR_ROW_CLASS,
      NOTA_SAVE_PULSE_CLASS,
      NOTA_CMDK_ITEM_CLASS,
    ];

    // Act|Assert — the stylesheet keys off these exact names
    expect(new Set(tokens).size).toBe(tokens.length);
    expect(tokens).toEqual([
      'nota-pressable',
      'nota-chrome-nav-item',
      'nota-sidebar-row',
      'nota-save-pulse',
      'nota-cmdk-item',
    ]);
  });
});

describe('nota interaction timing re-exports', () => {
  it('forwards the shared motion tokens rather than redefining them', () => {
    // Arrange|Act|Assert
    expect(reexportedPressIn).toBe(NOTA_PRESS_IN_MS);
    expect(reexportedPressOut).toBe(NOTA_PRESS_OUT_MS);
    expect(reexportedPressScale).toBe(NOTA_PRESS_SCALE);
  });

  it('presses in faster than it releases', () => {
    // Arrange|Act|Assert — asymmetric press is the documented feel
    expect(reexportedPressIn).toBeLessThan(reexportedPressOut);
    expect(reexportedPressScale).toBeLessThan(1);
  });
});
