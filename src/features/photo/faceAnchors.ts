import type { Landmark } from '@/types/landmarks';
import { distance2D, midpoint } from '@/lib/geometry';

/**
 * Key indices into MediaPipe's 468-point face mesh that we use to anchor
 * accessories (glasses, hats, ears, mustache...).
 * @see https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker
 */
export const FACE = {
  NOSE_TIP: 1,
  NOSE_BOTTOM: 2,
  FOREHEAD_TOP: 10,
  CHIN: 152,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  UPPER_LIP_TOP: 13,
} as const;

/** Geometry derived from one face, in normalized [0,1] image coordinates. */
export interface FaceAnchors {
  /** Left eye outer corner (image space). */
  leftEye: { x: number; y: number };
  /** Right eye outer corner (image space). */
  rightEye: { x: number; y: number };
  /** Midpoint between the two eye outer corners. */
  eyeCenter: { x: number; y: number };
  /** Distance between the eye outer corners (base scale for glasses). */
  eyeDistance: number;
  /** Full face width (cheek to cheek) — base scale for hats/ears. */
  faceWidth: number;
  /** Head roll in radians (image space), 0 = level. */
  rollRad: number;
  noseTip: { x: number; y: number };
  noseBottom: { x: number; y: number };
  foreheadTop: { x: number; y: number };
  mouthTop: { x: number; y: number };
}

const pt = (lm: Landmark): { x: number; y: number } => ({ x: lm.x, y: lm.y });

/**
 * Compute accessory anchor geometry from a face's landmarks.
 * Returns null if the required landmarks are missing.
 */
export function computeFaceAnchors(
  landmarks: Landmark[],
): FaceAnchors | null {
  const lEye = landmarks[FACE.LEFT_EYE_OUTER];
  const rEye = landmarks[FACE.RIGHT_EYE_OUTER];
  const lCheek = landmarks[FACE.LEFT_CHEEK];
  const rCheek = landmarks[FACE.RIGHT_CHEEK];
  const nose = landmarks[FACE.NOSE_TIP];
  const noseBot = landmarks[FACE.NOSE_BOTTOM];
  const forehead = landmarks[FACE.FOREHEAD_TOP];
  const lip = landmarks[FACE.UPPER_LIP_TOP];
  if (!lEye || !rEye || !lCheek || !rCheek || !nose || !noseBot || !forehead || !lip) {
    return null;
  }

  const eyeDistance = distance2D(lEye, rEye);
  // atan2(dy, dx): the tilt of the eye line.
  const rollRad = Math.atan2(rEye.y - lEye.y, rEye.x - lEye.x);

  return {
    leftEye: pt(lEye),
    rightEye: pt(rEye),
    eyeCenter: midpoint(lEye, rEye),
    eyeDistance,
    faceWidth: distance2D(lCheek, rCheek),
    rollRad,
    noseTip: pt(nose),
    noseBottom: pt(noseBot),
    foreheadTop: pt(forehead),
    mouthTop: pt(lip),
  };
}
