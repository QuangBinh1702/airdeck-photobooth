import { HAND, type HandLandmarks } from '@/types/landmarks';
import { getFingerStates } from '@/features/gestures/fingerState';
import { distance2D } from '@/lib/geometry';

/**
 * Gesture-driven shape overlays — the signature visual of a gesture photobooth.
 * Forming a hand sign draws a geometric shape that follows the hand(s) in
 * real time. All geometry is computed in normalized [0,1] image coordinates so
 * the renderer can scale it to any canvas size (and mirror it for selfie view).
 */
export type ShapeType = 'triangle' | 'star' | 'circle' | 'quad';

export interface Point2D {
  x: number;
  y: number;
}

export interface ShapeOverlay {
  type: ShapeType;
  label: string;
  emoji: string;
  /** Closed polygon/polyline points (normalized). Empty for pure circles. */
  points: Point2D[];
  /** For circles: center + radius (normalized). */
  center?: Point2D;
  radius?: number;
}

const tip = (hand: HandLandmarks, idx: number): Point2D => {
  const p = hand[idx]!;
  return { x: p.x, y: p.y };
};

/** Generate the 10 vertices of a 5-pointed star around a center. */
export function makeStarPoints(
  center: Point2D,
  outerR: number,
  innerR: number,
  spikes = 5,
  rotation = -Math.PI / 2,
): Point2D[] {
  const pts: Point2D[] = [];
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = rotation + i * step;
    pts.push({
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r,
    });
  }
  return pts;
}

/** Centroid of a set of points. */
export function centroid(points: Point2D[]): Point2D {
  const n = points.length || 1;
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / n, y: sum.y / n };
}

/** Order points counter-clockwise around their centroid (forms a simple polygon). */
export function orderByAngle(points: Point2D[]): Point2D[] {
  const c = centroid(points);
  return [...points].sort(
    (a, b) => Math.atan2(a.y - c.y, a.x - c.x) - Math.atan2(b.y - c.y, b.x - c.x),
  );
}

/** Palm center: average of wrist and the four finger MCP joints. */
function palmCenter(hand: HandLandmarks): Point2D {
  const ids = [
    HAND.WRIST,
    HAND.INDEX_MCP,
    HAND.MIDDLE_MCP,
    HAND.RING_MCP,
    HAND.PINKY_MCP,
  ];
  return centroid(ids.map((i) => tip(hand, i)));
}

/**
 * Decide which shape (if any) a single hand is forming, from its finger states.
 *   - thumb+index+middle (only)  -> triangle (connect those 3 fingertips)
 *   - thumb+pinky (only)         -> star
 *   - all five extended          -> circle (centered on palm)
 */
function singleHandShape(hand: HandLandmarks): ShapeOverlay | null {
  const f = getFingerStates(hand);

  if (f.thumb && f.index && f.middle && !f.ring && !f.pinky) {
    return {
      type: 'triangle',
      label: 'Tam giác',
      emoji: '🔺',
      points: [
        tip(hand, HAND.THUMB_TIP),
        tip(hand, HAND.INDEX_TIP),
        tip(hand, HAND.MIDDLE_TIP),
      ],
    };
  }

  if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) {
    const a = tip(hand, HAND.THUMB_TIP);
    const b = tip(hand, HAND.PINKY_TIP);
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const outerR = distance2D(hand[HAND.THUMB_TIP]!, hand[HAND.PINKY_TIP]!) / 2;
    return {
      type: 'star',
      label: 'Ngôi sao',
      emoji: '⭐',
      points: makeStarPoints(center, outerR, outerR * 0.45),
      center,
      radius: outerR,
    };
  }

  if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
    const center = palmCenter(hand);
    const fingertips = [
      HAND.THUMB_TIP,
      HAND.INDEX_TIP,
      HAND.MIDDLE_TIP,
      HAND.RING_TIP,
      HAND.PINKY_TIP,
    ].map((i) => hand[i]!);
    const radius = Math.max(
      ...fingertips.map((p) => distance2D(p, { x: center.x, y: center.y, z: 0 })),
    );
    return {
      type: 'circle',
      label: 'Vòng tròn',
      emoji: '⭕',
      points: [],
      center,
      radius,
    };
  }

  return null;
}

/**
 * Two-hand "frame" gesture: connect the index + thumb tips of both hands into a
 * quadrilateral (the classic photographer framing gesture → 3D-ish frame).
 */
function twoHandShape(a: HandLandmarks, b: HandLandmarks): ShapeOverlay {
  const corners = [
    tip(a, HAND.INDEX_TIP),
    tip(a, HAND.THUMB_TIP),
    tip(b, HAND.INDEX_TIP),
    tip(b, HAND.THUMB_TIP),
  ];
  return {
    type: 'quad',
    label: 'Khung 3D',
    emoji: '🔲',
    points: orderByAngle(corners),
  };
}

/**
 * Compute the shape overlay for the current frame's hands.
 * Returns null when no recognized shape gesture is present.
 */
export function computeShapeOverlay(
  hands: HandLandmarks[],
): ShapeOverlay | null {
  if (hands.length >= 2 && hands[0] && hands[1]) {
    return twoHandShape(hands[0], hands[1]);
  }
  if (hands.length === 1 && hands[0]) {
    return singleHandShape(hands[0]);
  }
  return null;
}
