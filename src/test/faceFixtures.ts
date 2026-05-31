import type { Landmark } from '@/types/landmarks';
import { FACE } from '@/features/photo/faceAnchors';

/**
 * Build a synthetic 468-point face mesh for tests. Only the indices used by
 * `computeFaceAnchors` are set to meaningful positions; the rest are zeros.
 *
 * @param opts.roll head roll in radians applied to the eye line.
 */
export function makeFace(opts: { roll?: number } = {}): Landmark[] {
  const roll = opts.roll ?? 0;
  const face: Landmark[] = Array.from({ length: 468 }, () => ({
    x: 0,
    y: 0,
    z: 0,
  }));

  const set = (i: number, x: number, y: number) => {
    face[i] = { x, y, z: 0 };
  };

  // Eye center at (0.5, 0.45), eyes 0.2 apart, optionally rolled.
  const cx = 0.5;
  const cy = 0.45;
  const half = 0.1;
  const dx = Math.cos(roll) * half;
  const dy = Math.sin(roll) * half;
  set(FACE.LEFT_EYE_OUTER, cx - dx, cy - dy);
  set(FACE.RIGHT_EYE_OUTER, cx + dx, cy + dy);

  set(FACE.LEFT_CHEEK, 0.35, 0.5);
  set(FACE.RIGHT_CHEEK, 0.65, 0.5);
  set(FACE.NOSE_TIP, 0.5, 0.52);
  set(FACE.NOSE_BOTTOM, 0.5, 0.56);
  set(FACE.FOREHEAD_TOP, 0.5, 0.3);
  set(FACE.UPPER_LIP_TOP, 0.5, 0.62);
  set(FACE.CHIN, 0.5, 0.72);

  return face;
}
