/**
 * Critically damped spring stepper for interruptible shell chrome.
 * Prefer this over fixed-duration tweens when Mod+S (or drag) can retarget mid-flight.
 */

export type CriticallyDampedSpringConfig = {
  /** Perceptual response (seconds) — settle time emerges from params. */
  responseS: number;
  /** 1 = critically damped (no bounce). */
  dampingRatio: number;
  stiffness: number;
  damping: number;
  mass: number;
  restDelta: number;
  restVelocity: number;
};

export type SpringSample = {
  value: number;
  velocity: number;
};

/**
 * Maps Apple-style response + damping ratio into mass-spring coefficients.
 * `dampingRatio === 1` → critically damped (no overshoot from rest).
 */
export function createCriticallyDampedSpringConfig(
  responseS: number,
  dampingRatio = 1,
): CriticallyDampedSpringConfig {
  const mass = 1;
  const safeResponse = Math.max(responseS, 0.001);
  const omega = (2 * Math.PI) / safeResponse;
  const stiffness = omega * omega * mass;
  const damping = 2 * dampingRatio * Math.sqrt(stiffness * mass);

  return {
    responseS: safeResponse,
    dampingRatio,
    stiffness,
    damping,
    mass,
    restDelta: 0.1,
    restVelocity: 0.1,
  };
}

export function isCriticallyDamped(
  config: Pick<CriticallyDampedSpringConfig, 'dampingRatio'>,
): boolean {
  return Math.abs(config.dampingRatio - 1) < 1e-9;
}

/** One integration step toward `target` (semi-implicit Euler). */
export function stepSpring(params: {
  value: number;
  velocity: number;
  target: number;
  config: CriticallyDampedSpringConfig;
  dtS: number;
}): SpringSample {
  const { stiffness, damping, mass } = params.config;
  const dt = Math.min(Math.max(params.dtS, 0), 1 / 30);
  const springForce = -stiffness * (params.value - params.target);
  const damperForce = -damping * params.velocity;
  const acceleration = (springForce + damperForce) / mass;
  const velocity = params.velocity + acceleration * dt;
  const value = params.value + velocity * dt;
  return { value, velocity };
}

export function springAtRest(
  sample: SpringSample,
  target: number,
  config: CriticallyDampedSpringConfig,
): boolean {
  return (
    Math.abs(sample.value - target) <= config.restDelta &&
    Math.abs(sample.velocity) <= config.restVelocity
  );
}

export type SpringAnimationHandle = {
  stop: () => void;
  getValue: (key: string) => number;
  getVelocity: (key: string) => number;
};

/**
 * Multi-property interruptible spring. Retarget by stopping and starting again
 * from live presentation values + carried velocity.
 */
export function animateSprings(options: {
  from: Record<string, { value: number; velocity?: number }>;
  to: Record<string, number>;
  config: CriticallyDampedSpringConfig;
  onUpdate: (values: Record<string, number>) => void;
  onComplete?: () => void;
  now?: () => number;
  scheduleFrame?: (cb: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
}): SpringAnimationHandle {
  const now = options.now ?? (() => performance.now());
  const scheduleFrame =
    options.scheduleFrame ?? ((cb) => requestAnimationFrame(cb));
  const cancelFrame =
    options.cancelFrame ??
    ((id) => {
      cancelAnimationFrame(id);
    });

  const keys = Object.keys(options.to);
  const state: Record<string, SpringSample> = {};
  for (const key of keys) {
    const from = options.from[key] ?? { value: options.to[key] ?? 0 };
    state[key] = {
      value: from.value,
      velocity: from.velocity ?? 0,
    };
  }

  let frameId: number | null = null;
  let lastTs = now();
  let stopped = false;

  const emit = (): void => {
    const values: Record<string, number> = {};
    for (const key of keys) {
      values[key] = state[key].value;
    }
    options.onUpdate(values);
  };

  const tick = (ts: number): void => {
    if (stopped) {
      return;
    }
    const dtS = Math.min((ts - lastTs) / 1000, 1 / 30);
    lastTs = ts;

    let allRest = true;
    for (const key of keys) {
      const target = options.to[key];
      const next = stepSpring({
        value: state[key].value,
        velocity: state[key].velocity,
        target,
        config: options.config,
        dtS,
      });
      state[key] = next;
      if (!springAtRest(next, target, options.config)) {
        allRest = false;
      }
    }

    emit();

    if (allRest) {
      for (const key of keys) {
        state[key] = { value: options.to[key], velocity: 0 };
      }
      emit();
      stopped = true;
      frameId = null;
      options.onComplete?.();
      return;
    }

    frameId = scheduleFrame(tick);
  };

  emit();
  frameId = scheduleFrame(tick);

  return {
    stop: () => {
      stopped = true;
      if (frameId != null) {
        cancelFrame(frameId);
        frameId = null;
      }
    },
    getValue: (key) => state[key].value,
    getVelocity: (key) => state[key].velocity,
  };
}
