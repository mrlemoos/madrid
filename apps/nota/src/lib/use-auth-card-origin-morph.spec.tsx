import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const takeAuthCardOrigin = vi.fn();
const forgetAuthCardOrigin = vi.fn();
const authCardInvertTransform = vi.fn();

vi.mock('@/lib/auth-card-origin', () => ({
  takeAuthCardOrigin,
  forgetAuthCardOrigin,
  authCardInvertTransform,
}));

const { useAuthCardOriginMorph } = await import('./use-auth-card-origin-morph');

const ORIGIN = {
  top: 10,
  left: 20,
  width: 300,
  height: 60,
  radius: 12,
  at: Date.now(),
};
const INVERT = { translateX: -40, translateY: -80, scaleX: 0.8, scaleY: 0.3 };

function mountWithShell(reducedMotion = false) {
  const shell = document.createElement('div');
  document.body.append(shell);
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reducedMotion })),
  );
  const view = renderHook(() => {
    useAuthCardOriginMorph({ current: shell });
  });
  return { shell, ...view };
}

/** Run both queued animation frames so the play step lands. */
function runFrames() {
  const queued = frames.splice(0);
  for (const fn of queued) fn(0);
  const next = frames.splice(0);
  for (const fn of next) fn(0);
}

let frames: FrameRequestCallback[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  frames = [];
  takeAuthCardOrigin.mockReturnValue(ORIGIN);
  authCardInvertTransform.mockReturnValue(INVERT);
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    frames.push(fn);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('useAuthCardOriginMorph', () => {
  it('does nothing without a card to morph', () => {
    // Arrange
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );

    // Act
    renderHook(() => {
      useAuthCardOriginMorph({ current: null });
    });

    // Assert
    expect(takeAuthCardOrigin).not.toHaveBeenCalled();
  });

  it('drops the stored origin without animating under reduced motion', () => {
    // Arrange|Act
    const { shell } = mountWithShell(true);

    // Assert
    expect(forgetAuthCardOrigin).toHaveBeenCalled();
    expect(shell.style.transform).toBe('');
    expect(shell.dataset.fromOrigin).toBeUndefined();
  });

  it('does nothing when the reader did not come from the landing box', () => {
    // Arrange
    takeAuthCardOrigin.mockReturnValue(null);

    // Act
    const { shell } = mountWithShell();

    // Assert
    expect(shell.style.transform).toBe('');
    expect(authCardInvertTransform).not.toHaveBeenCalled();
  });

  it('inverts the card onto the origin box before playing it back', () => {
    // Arrange|Act
    const { shell } = mountWithShell();

    // Assert
    expect(shell.dataset.fromOrigin).toBe('true');
    expect(shell.style.transformOrigin).toBe('top left');
    expect(shell.style.borderRadius).toBe('12px');
    expect(shell.style.transform).toBe(
      'translate(-40px, -80px) scale(0.8, 0.3)',
    );
  });

  it('plays the card back to its own geometry on the next frame', () => {
    // Arrange
    const { shell } = mountWithShell();

    // Act
    runFrames();

    // Assert
    expect(shell.dataset.originPlay).toBe('true');
    expect(shell.style.transform).toBe('translate(0px, 0px) scale(1, 1)');
    expect(shell.style.borderRadius).toBe('');
  });

  it('gives up when the two boxes do not describe a transform', () => {
    // Arrange
    authCardInvertTransform.mockReturnValue(null);

    // Act
    const { shell } = mountWithShell();

    // Assert
    expect(forgetAuthCardOrigin).toHaveBeenCalled();
    expect(shell.dataset.fromOrigin).toBeUndefined();
  });

  it('hands the styles back once the transform settles', () => {
    // Arrange
    const { shell } = mountWithShell();
    runFrames();

    // Act
    shell.dispatchEvent(
      Object.assign(new Event('transitionend'), { propertyName: 'transform' }),
    );

    // Assert — leaving inline styles behind would freeze the card
    expect(shell.style.transform).toBe('');
    expect(shell.style.overflow).toBe('');
    expect(shell.dataset.fromOrigin).toBeUndefined();
    expect(forgetAuthCardOrigin).toHaveBeenCalled();
  });

  it('ignores a transition on some other property', () => {
    // Arrange
    const { shell } = mountWithShell();
    runFrames();

    // Act
    shell.dispatchEvent(
      Object.assign(new Event('transitionend'), { propertyName: 'opacity' }),
    );

    // Assert
    expect(shell.dataset.originPlay).toBe('true');
  });

  it('treats a missing matchMedia as motion allowed', () => {
    // Arrange
    vi.stubGlobal('matchMedia', undefined);
    const shell = document.createElement('div');
    document.body.append(shell);

    // Act
    renderHook(() => {
      useAuthCardOriginMorph({ current: shell });
    });

    // Assert
    expect(shell.dataset.fromOrigin).toBe('true');
  });
});
