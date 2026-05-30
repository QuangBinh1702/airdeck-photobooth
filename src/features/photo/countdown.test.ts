import { describe, expect, it } from 'vitest';
import { Countdown } from '@/features/photo/countdown';

describe('Countdown', () => {
  it('is not running before start', () => {
    const c = new Countdown(3);
    const s = c.tick(0);
    expect(s.running).toBe(false);
    expect(s.justFinished).toBe(false);
  });

  it('counts down whole seconds', () => {
    const c = new Countdown(3);
    c.start(0);
    expect(c.tick(0).secondsLeft).toBe(3);
    expect(c.tick(500).secondsLeft).toBe(3);
    expect(c.tick(1000).secondsLeft).toBe(2);
    expect(c.tick(2000).secondsLeft).toBe(1);
    expect(c.tick(2500).secondsLeft).toBe(1);
  });

  it('fires justFinished exactly once at zero', () => {
    const c = new Countdown(3);
    c.start(0);
    c.tick(1000);
    const atZero = c.tick(3000);
    expect(atZero.justFinished).toBe(true);
    expect(atZero.secondsLeft).toBe(0);
    // Subsequent ticks do not re-fire.
    const after = c.tick(4000);
    expect(after.justFinished).toBe(false);
  });

  it('can be cancelled mid-countdown', () => {
    const c = new Countdown(3);
    c.start(0);
    c.tick(1000);
    c.cancel();
    expect(c.isRunning).toBe(false);
    expect(c.tick(5000).justFinished).toBe(false);
  });

  it('can be restarted', () => {
    const c = new Countdown(2);
    c.start(0);
    c.tick(2000); // finishes
    c.start(10_000);
    expect(c.tick(10_000).secondsLeft).toBe(2);
    expect(c.tick(12_000).justFinished).toBe(true);
  });
});
