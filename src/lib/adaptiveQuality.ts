/**
 * Adaptive quality controller (Phase 5).
 *
 * Watches a rolling FPS estimate and recommends a quality tier. When FPS drops
 * below the low watermark for a sustained period it steps down (lower model
 * complexity / resolution); when FPS is comfortably high it steps back up.
 * Hysteresis (separate up/down watermarks + dwell time) prevents oscillation.
 */
export type QualityTier = 'high' | 'medium' | 'low';

const TIER_ORDER: QualityTier[] = ['low', 'medium', 'high'];

export interface AdaptiveQualityOptions {
  downFps?: number;
  upFps?: number;
  dwellMs?: number;
  initialTier?: QualityTier;
}

export class AdaptiveQuality {
  private readonly downFps: number;
  private readonly upFps: number;
  private readonly dwellMs: number;
  private tierIndex: number;
  private lastChangeTime = -Infinity;

  constructor(opts: AdaptiveQualityOptions = {}) {
    this.downFps = opts.downFps ?? 20;
    this.upFps = opts.upFps ?? 50;
    this.dwellMs = opts.dwellMs ?? 2000;
    this.tierIndex = TIER_ORDER.indexOf(opts.initialTier ?? 'high');
  }

  get tier(): QualityTier {
    return TIER_ORDER[this.tierIndex]!;
  }

  /**
   * Feed the current FPS and timestamp; returns the (possibly changed) tier.
   */
  update(fps: number, now: number): QualityTier {
    if (now - this.lastChangeTime < this.dwellMs) {
      return this.tier;
    }
    if (fps < this.downFps && this.tierIndex > 0) {
      this.tierIndex -= 1;
      this.lastChangeTime = now;
    } else if (fps > this.upFps && this.tierIndex < TIER_ORDER.length - 1) {
      this.tierIndex += 1;
      this.lastChangeTime = now;
    }
    return this.tier;
  }

  reset(tier: QualityTier = 'high'): void {
    this.tierIndex = TIER_ORDER.indexOf(tier);
    this.lastChangeTime = -Infinity;
  }
}

/** A small FPS meter using an exponential moving average of frame deltas. */
export class FpsMeter {
  private emaMs: number | null = null;
  private readonly smoothing: number;
  private lastTime: number | null = null;

  constructor(smoothing = 0.1) {
    this.smoothing = smoothing;
  }

  /** Call once per rendered frame. */
  sample(now: number): void {
    if (this.lastTime !== null) {
      const delta = now - this.lastTime;
      if (delta > 0) {
        this.emaMs =
          this.emaMs === null
            ? delta
            : this.smoothing * delta + (1 - this.smoothing) * this.emaMs;
      }
    }
    this.lastTime = now;
  }

  get fps(): number {
    if (this.emaMs === null || this.emaMs <= 0) return 0;
    return 1000 / this.emaMs;
  }

  reset(): void {
    this.emaMs = null;
    this.lastTime = null;
  }
}
