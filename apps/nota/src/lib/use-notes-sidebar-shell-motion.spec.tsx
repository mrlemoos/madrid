import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gsap } from '@/lib/nota-motion';
import { useNotesSidebarShellMotion } from './use-notes-sidebar-shell-motion';

type FrameCallback = FrameRequestCallback;

/**
 * Manual animation clock: `animateSprings` reads `performance.now` and
 * `requestAnimationFrame` off the globals, so stub both to step frames by hand.
 */
function installManualClock() {
  let time = 0;
  let queue: FrameCallback[] = [];
  const raf = vi.fn((cb: FrameCallback) => {
    queue.push(cb);
    return queue.length;
  });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(raf);
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  vi.spyOn(performance, 'now').mockImplementation(() => time);

  return {
    step(ms = 16): void {
      time += ms;
      const pending = queue;
      queue = [];
      act(() => {
        pending.forEach((cb) => {
          cb(time);
        });
      });
    },
    runToRest(maxFrames = 400): void {
      for (let i = 0; i < maxFrames && queue.length > 0; i += 1) {
        this.step();
      }
    },
  };
}

function Harness(props: {
  open: boolean;
  widthPx: number;
  mounted: boolean;
}): JSX.Element {
  const { asideRef, railRef } = useNotesSidebarShellMotion(props);
  return (
    <aside ref={asideRef}>
      <div ref={railRef} />
    </aside>
  );
}

function findRail(container: HTMLElement): HTMLElement {
  const rail = container.querySelector('aside > div');
  if (!(rail instanceof HTMLElement)) {
    throw new Error('rail element not found');
  }
  return rail;
}

describe('useNotesSidebarShellMotion', () => {
  let setSpy: ReturnType<typeof vi.spyOn<typeof gsap, 'set'>>;

  beforeEach(() => {
    setSpy = vi.spyOn(gsap, 'set');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('snaps to the open layout instantly on first paint (no spring)', () => {
    // Arrange
    const clock = installManualClock();

    // Act
    const { container } = render(<Harness open widthPx={288} mounted />);

    // Assert
    const rail = findRail(container);
    const aside = container.querySelector('aside');
    expect(setSpy).toHaveBeenCalledWith(
      rail,
      expect.objectContaining({ x: 0, opacity: 1 }),
    );
    expect(setSpy).toHaveBeenCalledWith(
      aside,
      expect.objectContaining({ width: 288, maxWidth: 288 }),
    );
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    clock.runToRest();
  });

  it('snaps the clip to zero width after the close spring settles', () => {
    // Arrange
    const clock = installManualClock();
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    setSpy.mockClear();

    // Act
    rerender(<Harness open={false} widthPx={288} mounted />);
    clock.runToRest();

    // Assert
    expect(setSpy).toHaveBeenCalledWith(
      aside,
      expect.objectContaining({ width: 0, maxWidth: 'none' }),
    );
  });

  it('keeps the clip open when the close is interrupted by a re-open mid-spring', () => {
    // Arrange
    const clock = installManualClock();
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');

    // Act — start closing, advance a few frames, then re-open before rest
    rerender(<Harness open={false} widthPx={288} mounted />);
    clock.step();
    clock.step();
    setSpy.mockClear();
    rerender(<Harness open widthPx={288} mounted />);
    clock.runToRest();

    // Assert — re-open re-applies the open clip and never snaps to zero
    expect(setSpy).toHaveBeenCalledWith(
      aside,
      expect.objectContaining({ width: 288, maxWidth: 288 }),
    );
    expect(setSpy).not.toHaveBeenCalledWith(
      aside,
      expect.objectContaining({ width: 0, maxWidth: 'none' }),
    );
  });

  it('stops any running spring when the sidebar chrome unmounts', () => {
    // Arrange
    const clock = installManualClock();
    const { rerender } = render(<Harness open widthPx={288} mounted />);
    rerender(<Harness open={false} widthPx={288} mounted />);
    clock.step();

    // Act
    rerender(<Harness open={false} widthPx={288} mounted={false} />);
    const framesBefore = vi.mocked(requestAnimationFrame).mock.calls.length;
    clock.runToRest();

    // Assert — no new frames scheduled after unmount reset
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBe(
      framesBefore,
    );
  });
});
