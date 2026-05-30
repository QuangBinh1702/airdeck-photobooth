import type { Landmark } from '@/types/landmarks';

/** Euclidean distance in the XY plane (normalized coords). */
export function distance2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/** Euclidean distance in 3D. */
export function distance3D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}

/** Midpoint of two landmarks in the XY plane. */
export function midpoint(a: Landmark, b: Landmark): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Interior angle (in degrees) at vertex `b` formed by points a-b-c.
 * Returns a value in [0, 180]. Returns 0 for degenerate (zero-length) legs.
 */
export function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return 0;
  // Clamp to avoid NaN from floating point drift outside [-1, 1].
  const cos = clamp(dot / (m1 * m2), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new RangeError('clamp: min must be <= max');
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation between a and b by t in [0,1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map a value from one range to another, clamped to the output range.
 * Useful for converting a pinch distance into a 0-100 volume value.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMin === inMax) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  const raw = outMin + t * (outMax - outMin);
  const lo = Math.min(outMin, outMax);
  const hi = Math.max(outMin, outMax);
  return clamp(raw, lo, hi);
}

/**
 * Compute a hand "scale" reference (wrist to middle-finger MCP distance).
 * Used to normalize pinch thresholds so they work regardless of how close
 * the hand is to the camera.
 */
export function handScale(wrist: Landmark, middleMcp: Landmark): number {
  return distance2D(wrist, middleMcp);
}
