import { describe, expect, it } from 'vitest';
import {
  countExtended,
  detectPinch,
  getFingerStates,
  indexDirection,
  mirrorHandedness,
} from '@/features/gestures/fingerState';
import {
  curlFinger,
  makeFist,
  makeOpenHand,
  makePinch,
  makeVictory,
} from '@/test/handFixtures';

describe('getFingerStates', () => {
  it('detects all fingers extended on an open hand', () => {
    const s = getFingerStates(makeOpenHand());
    expect(s.index).toBe(true);
    expect(s.middle).toBe(true);
    expect(s.ring).toBe(true);
    expect(s.pinky).toBe(true);
  });

  it('detects all fingers curled on a fist', () => {
    const s = getFingerStates(makeFist());
    expect(s.index).toBe(false);
    expect(s.middle).toBe(false);
    expect(s.ring).toBe(false);
    expect(s.pinky).toBe(false);
  });

  it('detects a single curled finger', () => {
    const hand = curlFinger(makeOpenHand(), 'pinky');
    const s = getFingerStates(hand);
    expect(s.index).toBe(true);
    expect(s.pinky).toBe(false);
  });
});

describe('countExtended', () => {
  it('counts two for a victory sign', () => {
    const s = getFingerStates(makeVictory());
    // index + middle extended (thumb may vary), ring + pinky curled.
    expect(s.index && s.middle).toBe(true);
    expect(s.ring || s.pinky).toBe(false);
  });

  it('counts zero non-thumb fingers on a fist', () => {
    const s = getFingerStates(makeFist());
    const nonThumb = [s.index, s.middle, s.ring, s.pinky].filter(
      Boolean,
    ).length;
    expect(nonThumb).toBe(0);
    expect(countExtended(s)).toBeLessThanOrEqual(1);
  });
});

describe('detectPinch', () => {
  it('reports pinching when index tip meets thumb tip', () => {
    const res = detectPinch(makePinch());
    expect(res.isPinching).toBe(true);
    expect(res.normalizedDistance).toBeLessThan(0.45);
  });

  it('reports not pinching on an open hand', () => {
    const res = detectPinch(makeOpenHand());
    expect(res.isPinching).toBe(false);
  });

  it('returns infinity for an empty hand', () => {
    const res = detectPinch([]);
    expect(res.normalizedDistance).toBe(Number.POSITIVE_INFINITY);
    expect(res.isPinching).toBe(false);
  });
});

describe('indexDirection', () => {
  it('points up (negative y) on the open hand fixture', () => {
    const dir = indexDirection(makeOpenHand());
    expect(dir).not.toBeNull();
    expect(dir!.y).toBeLessThan(0);
  });

  it('returns null when landmarks are missing', () => {
    expect(indexDirection([])).toBeNull();
  });
});

describe('mirrorHandedness', () => {
  it('flips Left<->Right', () => {
    expect(mirrorHandedness('Left')).toBe('Right');
    expect(mirrorHandedness('Right')).toBe('Left');
  });
});
