import { describe, expect, it } from 'vitest';
import {
  animateSprings,
  createCriticallyDampedSpringConfig,
  isCriticallyDamped,
  stepSpring,
} from './nota-critically-damped-spring';

describe('createCriticallyDampedSpringConfig', () => {
  it('builds a critically damped spring from response seconds', () => {
    // Arrange
    const responseS = 0.3;

    // Act
    const config = createCriticallyDampedSpringConfig(responseS);

    // Assert
    expect(isCriticallyDamped(config)).toBe(true);
    expect(config.dampingRatio).toBe(1);
    expect(config.responseS).toBe(0.3);
  });

  it('never overshoots a rest target from zero velocity (no bounce)', () => {
    // Arrange
    const config = createCriticallyDampedSpringConfig(0.3);
    let value = 0;
    let velocity = 0;
    const target = 100;
    let maxValue = value;

    // Act — integrate until near rest
    for (let i = 0; i < 120; i += 1) {
      const next = stepSpring({ value, velocity, target, config, dtS: 1 / 60 });
      value = next.value;
      velocity = next.velocity;
      maxValue = Math.max(maxValue, value);
    }

    // Assert — critically damped approaches from below without crossing
    expect(maxValue).toBeLessThanOrEqual(target + 0.01);
    expect(value).toBeGreaterThan(target - 1);
  });

  it('retargets from live presentation values with carried velocity', () => {
    // Arrange
    const config = createCriticallyDampedSpringConfig(0.3);
    const updates: Array<Record<string, number>> = [];
    let frame = 0;
    const callbacks: FrameRequestCallback[] = [];

    const handle = animateSprings({
      from: { x: { value: -20, velocity: 40 } },
      to: { x: 0 },
      config,
      onUpdate: (values) => {
        updates.push({ ...values });
      },
      now: () => frame * (1000 / 60),
      scheduleFrame: (cb) => {
        callbacks.push(cb);
        return callbacks.length;
      },
      cancelFrame: () => {
        callbacks.length = 0;
      },
    });

    // Act — one frame toward open, then interrupt toward closed
    frame = 1;
    callbacks.shift()?.(frame * (1000 / 60));
    const midX = handle.getValue('x');
    const midV = handle.getVelocity('x');
    handle.stop();

    const retargetUpdates: number[] = [];
    const retargetCallbacks: FrameRequestCallback[] = [];
    animateSprings({
      from: { x: { value: midX, velocity: midV } },
      to: { x: -20 },
      config,
      onUpdate: (values) => {
        retargetUpdates.push(values.x);
      },
      now: () => frame * (1000 / 60),
      scheduleFrame: (cb) => {
        retargetCallbacks.push(cb);
        return retargetCallbacks.length;
      },
      cancelFrame: () => {
        retargetCallbacks.length = 0;
      },
    });
    frame = 2;
    retargetCallbacks.shift()?.(frame * (1000 / 60));

    // Assert — first sample after retarget matches live mid-flight value
    expect(retargetUpdates[0]).toBeCloseTo(midX, 5);
    expect(midX).toBeGreaterThan(-20);
    expect(midX).toBeLessThan(0);
  });
});
