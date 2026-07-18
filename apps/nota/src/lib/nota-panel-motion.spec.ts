import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  NOTA_PANEL_FADE_BLUR_PX,
  NOTA_PANEL_FADE_MS,
  NOTA_PANEL_FADE_CLASS,
  consumeNavIntent,
  markNavIntent,
  peekNavIntent,
  resetNavIntent,
  resolvePanelMotion,
} from './nota-panel-motion';

describe('resolvePanelMotion', () => {
  it('returns none with zero duration for keyboard intent', () => {
    // Arrange
    const intent = 'keyboard' as const;

    // Act
    const motion = resolvePanelMotion(intent);

    // Assert
    expect(motion.mode).toBe('none');
    expect(motion.durationMs).toBe(0);
    expect(motion.blurPx).toBe(0);
    expect(motion.className).toBe('');
  });

  it('returns a short opacity fade for pointer intent', () => {
    // Arrange
    const intent = 'pointer' as const;

    // Act
    const motion = resolvePanelMotion(intent);

    // Assert
    expect(motion.mode).toBe('fade');
    expect(motion.durationMs).toBeLessThanOrEqual(180);
    expect(motion.durationMs).toBe(NOTA_PANEL_FADE_MS);
    expect(motion.blurPx).toBeLessThanOrEqual(2);
    expect(motion.blurPx).toBe(NOTA_PANEL_FADE_BLUR_PX);
    expect(motion.className).toBe(NOTA_PANEL_FADE_CLASS);
  });
});

describe('nav intent markers', () => {
  beforeEach(() => {
    resetNavIntent();
    document.documentElement.removeAttribute('data-nav-intent');
  });

  afterEach(() => {
    resetNavIntent();
    document.documentElement.removeAttribute('data-nav-intent');
  });

  it('defaults to keyboard so programmatic hash changes stay instant', () => {
    // Arrange — fresh module state via reset

    // Act
    const intent = peekNavIntent();

    // Assert
    expect(intent).toBe('keyboard');
    expect(resolvePanelMotion(intent).mode).toBe('none');
  });

  it('markNavIntent writes data-nav-intent on the document element', () => {
    // Arrange
    const intent = 'pointer' as const;

    // Act
    markNavIntent(intent);

    // Assert
    expect(document.documentElement.getAttribute('data-nav-intent')).toBe(
      'pointer',
    );
    expect(peekNavIntent()).toBe('pointer');
  });

  it('consumeNavIntent returns the pending intent and resets to keyboard', () => {
    // Arrange
    markNavIntent('pointer');

    // Act
    const consumed = consumeNavIntent();

    // Assert
    expect(consumed).toBe('pointer');
    expect(peekNavIntent()).toBe('keyboard');
    expect(document.documentElement.getAttribute('data-nav-intent')).toBe(
      'keyboard',
    );
  });
});
