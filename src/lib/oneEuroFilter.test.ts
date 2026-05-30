import { describe, expect, it } from 'vitest';
import { OneEuroFilter, OneEuroPoint } from '@/lib/oneEuroFilter';

describe('OneEuroFilter', () => {
  it('returns the first sample unchanged', () => {
    const f = new OneEuroFilter();
    expect(f.filter(0.5, 0)).toBe(0.5);
  });

  it('smooths a noisy but stationary signal toward its mean', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0.0 });
    const noisy = [0.5, 0.52, 0.48, 0.51, 0.49, 0.5];
    let out = 0;
    noisy.forEach((v, i) => {
      out = f.filter(v, i * 16.7);
    });
    // Output should stay near 0.5 and never swing to the noise extremes.
    expect(out).toBeGreaterThan(0.485);
    expect(out).toBeLessThan(0.515);
  });

  it('tracks a moving signal (does not get stuck at the start)', () => {
    const f = new OneEuroFilter();
    let out = 0;
    for (let i = 0; i < 30; i += 1) {
      out = f.filter(i / 30, i * 16.7);
    }
    expect(out).toBeGreaterThan(0.5);
  });

  it('handles non-increasing timestamps without producing NaN', () => {
    const f = new OneEuroFilter();
    f.filter(0.1, 100);
    const out = f.filter(0.2, 100); // dt = 0
    expect(Number.isNaN(out)).toBe(false);
  });

  it('resets internal state', () => {
    const f = new OneEuroFilter();
    f.filter(0.9, 0);
    f.filter(0.9, 16);
    f.reset();
    expect(f.filter(0.1, 0)).toBe(0.1);
  });
});

describe('OneEuroPoint', () => {
  it('filters x and y independently', () => {
    const p = new OneEuroPoint();
    const first = p.filter({ x: 0.2, y: 0.8 }, 0);
    expect(first).toEqual({ x: 0.2, y: 0.8 });
  });
});
