import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOTA_PANEL_FADE_BLUR_PX,
  NOTA_PANEL_FADE_MS,
  NOTA_PANEL_FADE_CLASS,
  consumeNavIntent,
  createNavIntentRegister,
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

describe('createNavIntentRegister', () => {
  it('defaults to keyboard and writes the DOM marker on mark', () => {
    // Arrange
    const setAttribute = vi.fn();
    const register = createNavIntentRegister({
      requestAnimationFrame: null,
      getDocumentElement: () => ({ setAttribute }),
    });

    // Act
    const before = register.peek();
    register.mark('pointer');

    // Assert
    expect(before).toBe('keyboard');
    expect(register.peek()).toBe('pointer');
    expect(setAttribute).toHaveBeenLastCalledWith('data-nav-intent', 'pointer');
  });

  it('consume returns the pending intent then resets to keyboard', () => {
    // Arrange
    const register = createNavIntentRegister({
      requestAnimationFrame: null,
      getDocumentElement: () => null,
    });
    register.mark('pointer');

    // Act
    const consumed = register.consume();

    // Assert
    expect(consumed).toBe('pointer');
    expect(register.peek()).toBe('keyboard');
  });

  it('auto-resets to keyboard on the next animation frame', () => {
    // Arrange
    const frames: Array<() => void> = [];
    const register = createNavIntentRegister({
      requestAnimationFrame: (cb) => {
        frames.push(cb);
      },
      getDocumentElement: () => null,
    });

    // Act
    register.mark('pointer');
    const midFrame = register.peek();
    frames.forEach((run) => {
      run();
    });

    // Assert
    expect(midFrame).toBe('pointer');
    expect(register.peek()).toBe('keyboard');
  });

  it('a later mark cancels an earlier frame reset via the epoch guard', () => {
    // Arrange
    const frames: Array<() => void> = [];
    const register = createNavIntentRegister({
      requestAnimationFrame: (cb) => {
        frames.push(cb);
      },
      getDocumentElement: () => null,
    });

    // Act
    register.mark('pointer');
    register.mark('pointer');
    // Run only the first (stale) scheduled reset.
    frames[0]?.();

    // Assert
    expect(register.peek()).toBe('pointer');
  });

  it('reset restores the keyboard default and DOM marker', () => {
    // Arrange
    const setAttribute = vi.fn();
    const register = createNavIntentRegister({
      requestAnimationFrame: null,
      getDocumentElement: () => ({ setAttribute }),
    });
    register.mark('pointer');

    // Act
    register.reset();

    // Assert
    expect(register.peek()).toBe('keyboard');
    expect(setAttribute).toHaveBeenLastCalledWith(
      'data-nav-intent',
      'keyboard',
    );
  });

  it('isolates state between instances', () => {
    // Arrange
    const a = createNavIntentRegister({
      requestAnimationFrame: null,
      getDocumentElement: () => null,
    });
    const b = createNavIntentRegister({
      requestAnimationFrame: null,
      getDocumentElement: () => null,
    });

    // Act
    a.mark('pointer');

    // Assert
    expect(a.peek()).toBe('pointer');
    expect(b.peek()).toBe('keyboard');
  });
});
