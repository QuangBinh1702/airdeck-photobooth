/**
 * One-Euro filter — adaptive low-pass filter for noisy real-time signals.
 *
 * It reduces jitter at low speeds while keeping latency low at high speeds,
 * which is exactly what a hand-driven cursor needs. Based on Casiez et al.
 * "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input".
 *
 * Reference: https://gery.casiez.net/1euro/
 */
export interface OneEuroOptions {
  /** Minimum cutoff frequency (Hz). Lower = more smoothing at rest. */
  minCutoff?: number;
  /** Speed coefficient. Higher = less lag on fast motion. */
  beta?: number;
  /** Cutoff for the derivative (Hz). */
  dCutoff?: number;
}

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

export class OneEuroFilter {
  private readonly minCutoff: number;
  private readonly beta: number;
  private readonly dCutoff: number;

  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(options: OneEuroOptions = {}) {
    this.minCutoff = options.minCutoff ?? 1.0;
    this.beta = options.beta ?? 0.007;
    this.dCutoff = options.dCutoff ?? 1.0;
  }

  /**
   * Push a new sample.
   * @param x raw value
   * @param timestamp monotonic time in milliseconds
   * @returns filtered value
   */
  filter(x: number, timestamp: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = timestamp;
      this.xPrev = x;
      this.dxPrev = 0;
      return x;
    }

    let dt = (timestamp - this.tPrev) / 1000; // seconds
    // Guard against zero/negative dt (duplicate timestamps, clock issues).
    if (dt <= 0) dt = 1 / 60;

    const dx = (x - this.xPrev) / dt;
    const aD = alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const aX = alpha(cutoff, dt);
    const xHat = aX * x + (1 - aX) * this.xPrev;

    this.xPrev = xHat;
    this.dxPrev = dxHat;
    this.tPrev = timestamp;
    return xHat;
  }

  /** Reset internal state (e.g. when the hand is lost and re-acquired). */
  reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

/** Convenience: filter a 2D point with two independent One-Euro filters. */
export class OneEuroPoint {
  private readonly fx: OneEuroFilter;
  private readonly fy: OneEuroFilter;

  constructor(options?: OneEuroOptions) {
    this.fx = new OneEuroFilter(options);
    this.fy = new OneEuroFilter(options);
  }

  filter(
    p: { x: number; y: number },
    timestamp: number,
  ): { x: number; y: number } {
    return {
      x: this.fx.filter(p.x, timestamp),
      y: this.fy.filter(p.y, timestamp),
    };
  }

  reset(): void {
    this.fx.reset();
    this.fy.reset();
  }
}
