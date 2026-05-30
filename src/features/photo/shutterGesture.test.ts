import { describe, expect, it } from 'vitest';
import {
  SHUTTER_GESTURES,
  classifyShutterGesture,
  getShutterGesture,
} from '@/features/photo/shutterGesture';
import type { FingerStates } from '@/features/gestures/fingerState';

const fs = (
  thumb: boolean,
  index: boolean,
  middle: boolean,
  ring: boolean,
  pinky: boolean,
): FingerStates => ({ thumb, index, middle, ring, pinky });

describe('classifyShutterGesture', () => {
  it('recognizes open palm (all extended)', () => {
    expect(classifyShutterGesture(fs(true, true, true, true, true))).toBe(
      'open_palm',
    );
  });

  it('recognizes victory (index + middle)', () => {
    expect(classifyShutterGesture(fs(false, true, true, false, false))).toBe(
      'victory',
    );
  });

  it('recognizes rock / ILoveYou (thumb + index + pinky)', () => {
    expect(classifyShutterGesture(fs(true, true, false, false, true))).toBe(
      'rock',
    );
  });

  it('recognizes call me (thumb + pinky)', () => {
    expect(classifyShutterGesture(fs(true, false, false, false, true))).toBe(
      'call_me',
    );
  });

  it('recognizes thumb up and point', () => {
    expect(classifyShutterGesture(fs(true, false, false, false, false))).toBe(
      'thumb_up',
    );
    expect(classifyShutterGesture(fs(false, true, false, false, false))).toBe(
      'point',
    );
  });

  it('returns none for an unmapped pattern (e.g. fist)', () => {
    expect(classifyShutterGesture(fs(false, false, false, false, false))).toBe(
      'none',
    );
    // three middle fingers only -> not defined
    expect(classifyShutterGesture(fs(false, true, true, true, false))).toBe(
      'none',
    );
  });
});

describe('SHUTTER_GESTURES catalog', () => {
  it('has unique ids and emojis', () => {
    const ids = SHUTTER_GESTURES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes lookup by id', () => {
    expect(getShutterGesture('victory')?.emoji).toBe('✌️');
    expect(getShutterGesture('none')).toBeUndefined();
  });
});
