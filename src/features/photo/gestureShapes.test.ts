import { describe, expect, it } from 'vitest';
import {
  centroid,
  computeShapeOverlay,
  makeStarPoints,
  orderByAngle,
} from '@/features/photo/gestureShapes';
import { HAND, type HandLandmarks } from '@/types/landmarks';
import {
  makeOpenHand,
  makeVictory,
  curlFinger,
} from '@/test/handFixtures';

/** Open hand but with only thumb+index+middle extended (triangle gesture). */
function makeTriangleHand(): HandLandmarks {
  let hand = makeOpenHand();
  hand = curlFinger(hand, 'ring');
  hand = curlFinger(hand, 'pinky');
  // makeOpenHand has thumb extended; index+middle extended; ring+pinky curled.
  return hand;
}

/** Thumb + pinky only (star / call-me shape base). */
function makeStarHand(): HandLandmarks {
  let hand = makeOpenHand();
  hand = curlFinger(hand, 'index');
  hand = curlFinger(hand, 'middle');
  hand = curlFinger(hand, 'ring');
  return hand;
}

describe('makeStarPoints', () => {
  it('produces 10 vertices for a 5-point star', () => {
    const pts = makeStarPoints({ x: 0.5, y: 0.5 }, 0.2, 0.1);
    expect(pts).toHaveLength(10);
  });

  it('alternates outer and inner radius distances from center', () => {
    const center = { x: 0, y: 0 };
    const pts = makeStarPoints(center, 1, 0.4);
    const r0 = Math.hypot(pts[0]!.x, pts[0]!.y);
    const r1 = Math.hypot(pts[1]!.x, pts[1]!.y);
    expect(r0).toBeCloseTo(1, 5);
    expect(r1).toBeCloseTo(0.4, 5);
  });
});

describe('centroid / orderByAngle', () => {
  it('computes the centroid of a square', () => {
    const c = centroid([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ]);
    expect(c).toEqual({ x: 1, y: 1 });
  });

  it('orders points into a non-self-intersecting ring', () => {
    const ordered = orderByAngle([
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
    ]);
    expect(ordered).toHaveLength(4);
    // Consecutive points should be adjacent corners (distance 2), not diagonal.
    for (let i = 0; i < 4; i += 1) {
      const a = ordered[i]!;
      const b = ordered[(i + 1) % 4]!;
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(2, 5);
    }
  });
});

describe('computeShapeOverlay — single hand', () => {
  it('returns null when no hands are present', () => {
    expect(computeShapeOverlay([])).toBeNull();
  });

  it('forms a triangle from thumb+index+middle', () => {
    const shape = computeShapeOverlay([makeTriangleHand()]);
    expect(shape?.type).toBe('triangle');
    expect(shape?.points).toHaveLength(3);
  });

  it('forms a star from thumb+pinky', () => {
    const shape = computeShapeOverlay([makeStarHand()]);
    expect(shape?.type).toBe('star');
    expect(shape?.points).toHaveLength(10);
    expect(shape?.center).toBeDefined();
  });

  it('forms a circle from an open palm (all five extended)', () => {
    const shape = computeShapeOverlay([makeOpenHand()]);
    expect(shape?.type).toBe('circle');
    expect(shape?.center).toBeDefined();
    expect(shape?.radius).toBeGreaterThan(0);
  });

  it('returns null for an unrecognized shape (victory)', () => {
    // Victory = index+middle only (no thumb) -> not a defined shape gesture.
    const v = makeVictory();
    // Force the thumb to read as curled: sharp bend at the IP joint.
    v[HAND.THUMB_MCP] = { x: 0.4, y: 0.8, z: 0 };
    v[HAND.THUMB_IP] = { x: 0.34, y: 0.76, z: 0 };
    v[HAND.THUMB_TIP] = { x: 0.4, y: 0.74, z: 0 };
    const shape = computeShapeOverlay([v]);
    expect(shape).toBeNull();
  });
});

describe('computeShapeOverlay — two hands', () => {
  it('forms a quad frame from two hands', () => {
    const shape = computeShapeOverlay([makeOpenHand(), makeOpenHand()]);
    expect(shape?.type).toBe('quad');
    expect(shape?.points).toHaveLength(4);
  });
});
