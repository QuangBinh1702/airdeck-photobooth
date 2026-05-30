import { describe, expect, it } from 'vitest';
import { SwipeDetector } from '@/features/gestures/swipe';
import { HAND, type HandLandmarks } from '@/types/landmarks';

/** Minimal hand with only the wrist set at a given x. */
function handAtX(x: number): HandLandmarks {
  const hand: HandLandmarks = Array.from({ length: 21 }, () => ({
    x: 0,
    y: 0,
    z: 0,
  }));
  hand[HAND.WRIST] = { x, y: 0.5, z: 0 };
  return hand;
}

/** Push a sequence of (x, t) samples and return the first fired direction. */
function firstFired(
  d: SwipeDetector,
  samples: [number, number][],
): ReturnType<SwipeDetector['push']> {
  let fired: ReturnType<SwipeDetector['push']> = null;
  for (const [x, t] of samples) {
    const dir = d.push(handAtX(x), t);
    if (dir && !fired) fired = dir;
  }
  return fired;
}

describe('SwipeDetector', () => {
  it('fires right on fast left-to-right motion (image space)', () => {
    const d = new SwipeDetector({ velocityThreshold: 1.0, windowMs: 300 });
    const fired = firstFired(d, [
      [0.1, 0],
      [0.5, 100],
      [0.9, 200],
    ]);
    expect(fired).toBe('right');
  });

  it('fires left on fast right-to-left motion', () => {
    const d = new SwipeDetector({ velocityThreshold: 1.0, windowMs: 300 });
    const fired = firstFired(d, [
      [0.9, 0],
      [0.5, 100],
      [0.1, 200],
    ]);
    expect(fired).toBe('left');
  });

  it('does not fire on the very first sample', () => {
    const d = new SwipeDetector({ velocityThreshold: 1.0 });
    expect(d.push(handAtX(0.1), 0)).toBeNull();
  });

  it('does not fire on slow motion', () => {
    const d = new SwipeDetector({ velocityThreshold: 1.5 });
    let dir: ReturnType<SwipeDetector['push']> = null;
    for (let i = 0; i <= 10; i += 1) {
      dir = d.push(handAtX(0.1 + i * 0.01), i * 50);
    }
    expect(dir).toBeNull();
  });

  it('respects the cooldown (no double fire)', () => {
    const d = new SwipeDetector({ velocityThreshold: 1.0, cooldownMs: 600 });
    d.push(handAtX(0.1), 0);
    d.push(handAtX(0.9), 200);
    // Immediately swipe again within cooldown.
    d.push(handAtX(0.1), 250);
    const dir = d.push(handAtX(0.9), 400);
    expect(dir).toBeNull();
  });

  it('returns null when wrist landmark is missing', () => {
    const d = new SwipeDetector();
    expect(d.push([], 0)).toBeNull();
  });
});
