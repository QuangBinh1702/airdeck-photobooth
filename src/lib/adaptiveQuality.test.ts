import { describe, expect, it } from 'vitest';
import { AdaptiveQuality, FpsMeter } from '@/lib/adaptiveQuality';

describe('AdaptiveQuality', () => {
  it('starts at the initial tier', () => {
    expect(new AdaptiveQuality().tier).toBe('high');
    expect(new AdaptiveQuality({ initialTier: 'low' }).tier).toBe('low');
  });

  it('steps down when FPS is sustained below the low watermark', () => {
    const aq = new AdaptiveQuality({ downFps: 20, dwellMs: 1000 });
    expect(aq.update(10, 0)).toBe('medium');
    // Within dwell window, no further change.
    expect(aq.update(10, 500)).toBe('medium');
    // After dwell window, steps down again.
    expect(aq.update(10, 1500)).toBe('low');
    // Cannot go below low.
    expect(aq.update(10, 3000)).toBe('low');
  });

  it('steps up when FPS is comfortably high', () => {
    const aq = new AdaptiveQuality({ upFps: 50, dwellMs: 1000, initialTier: 'low' });
    expect(aq.update(60, 0)).toBe('medium');
    expect(aq.update(60, 1500)).toBe('high');
    expect(aq.update(60, 3000)).toBe('high');
  });

  it('does not oscillate within the dwell window', () => {
    const aq = new AdaptiveQuality({ downFps: 20, upFps: 50, dwellMs: 2000 });
    expect(aq.update(10, 0)).toBe('medium');
    expect(aq.update(10, 100)).toBe('medium');
    expect(aq.update(10, 1999)).toBe('medium');
  });

  it('resets to a given tier', () => {
    const aq = new AdaptiveQuality();
    aq.update(5, 0);
    aq.reset('low');
    expect(aq.tier).toBe('low');
  });
});

describe('FpsMeter', () => {
  it('is zero before two samples', () => {
    const m = new FpsMeter();
    expect(m.fps).toBe(0);
    m.sample(0);
    expect(m.fps).toBe(0);
  });

  it('estimates ~60fps from 16.7ms frame deltas', () => {
    const m = new FpsMeter(1); // no smoothing, use latest delta
    m.sample(0);
    m.sample(16.7);
    expect(m.fps).toBeGreaterThan(55);
    expect(m.fps).toBeLessThan(65);
  });
});
