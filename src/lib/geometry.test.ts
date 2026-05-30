import { describe, expect, it } from 'vitest';
import {
  angleDeg,
  clamp,
  distance2D,
  distance3D,
  lerp,
  mapRange,
  midpoint,
} from '@/lib/geometry';

const L = (x: number, y: number, z = 0) => ({ x, y, z });

describe('distance2D / distance3D', () => {
  it('computes a 3-4-5 triangle in 2D', () => {
    expect(distance2D(L(0, 0), L(3, 4))).toBe(5);
  });

  it('ignores z in 2D but counts it in 3D', () => {
    expect(distance2D(L(0, 0, 0), L(0, 0, 5))).toBe(0);
    expect(distance3D(L(0, 0, 0), L(0, 0, 5))).toBe(5);
  });
});

describe('midpoint', () => {
  it('returns the average of x and y', () => {
    expect(midpoint(L(0, 0), L(4, 2))).toEqual({ x: 2, y: 1 });
  });
});

describe('angleDeg', () => {
  it('returns 90 for a right angle', () => {
    expect(angleDeg(L(1, 0), L(0, 0), L(0, 1))).toBeCloseTo(90, 5);
  });

  it('returns 180 for a straight line', () => {
    expect(angleDeg(L(-1, 0), L(0, 0), L(1, 0))).toBeCloseTo(180, 5);
  });

  it('returns 0 for degenerate (zero-length) legs', () => {
    expect(angleDeg(L(0, 0), L(0, 0), L(1, 0))).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps below, within, and above range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(50, 0, 10)).toBe(10);
  });

  it('throws when min > max', () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});

describe('lerp', () => {
  it('interpolates endpoints and midpoint', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe('mapRange', () => {
  it('maps a value linearly between ranges', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
  });

  it('clamps to the output range', () => {
    expect(mapRange(-1, 0, 10, 0, 100)).toBe(0);
    expect(mapRange(11, 0, 10, 0, 100)).toBe(100);
  });

  it('handles inverted output ranges', () => {
    expect(mapRange(0, 0, 10, 100, 0)).toBe(100);
    expect(mapRange(10, 0, 10, 100, 0)).toBe(0);
  });

  it('returns outMin when input range is zero-width', () => {
    expect(mapRange(5, 4, 4, 0, 100)).toBe(0);
  });
});
