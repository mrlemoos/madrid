/**
 * Apple-style rubber-banding: progressive resistance past a hard edge.
 * @see Designing Fluid Interfaces (WWDC 2018)
 */

/** Default Apple rubber-band constant. */
export const NOTA_RUBBERBAND_CONSTANT = 0.55;

/**
 * Maps free overshoot into resisted travel.
 * `dimension` is typically the visible track length (e.g. sidebar width band).
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant: number = NOTA_RUBBERBAND_CONSTANT,
): number {
  if (overshoot === 0 || dimension <= 0 || constant <= 0) {
    return 0;
  }
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

/**
 * Allows soft travel past min/max using rubberband resistance.
 * Values inside the band pass through unchanged.
 */
export function rubberbandBeyondClamp(
  value: number,
  min: number,
  max: number,
  dimension: number,
  constant: number = NOTA_RUBBERBAND_CONSTANT,
): number {
  if (value < min) {
    return min - rubberband(min - value, dimension, constant);
  }
  if (value > max) {
    return max + rubberband(value - max, dimension, constant);
  }
  return value;
}
