import { HAND, type HandLandmarks, type Handedness } from '@/types/landmarks';
import { angleDeg, distance2D, handScale } from '@/lib/geometry';

/** Whether each finger is extended (true) or curled (false). */
export interface FingerStates {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

/**
 * A finger (non-thumb) is considered "extended" when the angle at its PIP
 * joint is close to straight (large angle). Curled fingers bend sharply.
 */
const EXTENDED_ANGLE_THRESHOLD = 160;

function fingerExtended(
  hand: HandLandmarks,
  mcp: number,
  pip: number,
  tip: number,
): boolean {
  const a = hand[mcp];
  const b = hand[pip];
  const c = hand[tip];
  if (!a || !b || !c) return false;
  return angleDeg(a, b, c) >= EXTENDED_ANGLE_THRESHOLD;
}

/**
 * The thumb is trickier: we compare the thumb tip's distance from the pinky
 * MCP. When extended (out to the side) it is far; when tucked it is close.
 * Normalized by hand scale so it is distance-invariant.
 */
function thumbExtended(hand: HandLandmarks): boolean {
  const tip = hand[HAND.THUMB_TIP];
  const ip = hand[HAND.THUMB_IP];
  const mcp = hand[HAND.THUMB_MCP];
  if (!tip || !ip || !mcp) return false;
  // Angle at the thumb IP joint: straight thumb => large angle.
  return angleDeg(mcp, ip, tip) >= 150;
}

/** Compute per-finger extended/curled states for one hand. */
export function getFingerStates(hand: HandLandmarks): FingerStates {
  return {
    thumb: thumbExtended(hand),
    index: fingerExtended(hand, HAND.INDEX_MCP, HAND.INDEX_PIP, HAND.INDEX_TIP),
    middle: fingerExtended(
      hand,
      HAND.MIDDLE_MCP,
      HAND.MIDDLE_PIP,
      HAND.MIDDLE_TIP,
    ),
    ring: fingerExtended(hand, HAND.RING_MCP, HAND.RING_PIP, HAND.RING_TIP),
    pinky: fingerExtended(hand, HAND.PINKY_MCP, HAND.PINKY_PIP, HAND.PINKY_TIP),
  };
}

/** Count how many fingers are extended. */
export function countExtended(states: FingerStates): number {
  return Object.values(states).filter(Boolean).length;
}

export interface PinchResult {
  /** Normalized distance between thumb tip and index tip (scale-invariant). */
  normalizedDistance: number;
  /** True when the pinch is closed (thumb + index touching). */
  isPinching: boolean;
}

/** Default closed-pinch threshold as a fraction of hand scale. */
export const PINCH_CLOSE_RATIO = 0.45;

/**
 * Detect a pinch (thumb tip near index tip), normalized by hand size so it
 * works whether the hand is near or far from the camera.
 */
export function detectPinch(
  hand: HandLandmarks,
  closeRatio = PINCH_CLOSE_RATIO,
): PinchResult {
  const thumbTip = hand[HAND.THUMB_TIP];
  const indexTip = hand[HAND.INDEX_TIP];
  const wrist = hand[HAND.WRIST];
  const middleMcp = hand[HAND.MIDDLE_MCP];
  if (!thumbTip || !indexTip || !wrist || !middleMcp) {
    return { normalizedDistance: Number.POSITIVE_INFINITY, isPinching: false };
  }
  const scale = handScale(wrist, middleMcp);
  if (scale === 0) {
    return { normalizedDistance: Number.POSITIVE_INFINITY, isPinching: false };
  }
  const normalizedDistance = distance2D(thumbTip, indexTip) / scale;
  return {
    normalizedDistance,
    isPinching: normalizedDistance <= closeRatio,
  };
}

/** Pointing direction of the index finger as a unit-ish vector (MCP -> TIP). */
export function indexDirection(
  hand: HandLandmarks,
): { x: number; y: number } | null {
  const mcp = hand[HAND.INDEX_MCP];
  const tip = hand[HAND.INDEX_TIP];
  if (!mcp || !tip) return null;
  return { x: tip.x - mcp.x, y: tip.y - mcp.y };
}

/** Mirror handedness for a front-facing (selfie) camera, if needed. */
export function mirrorHandedness(h: Handedness): Handedness {
  return h === 'Left' ? 'Right' : 'Left';
}
