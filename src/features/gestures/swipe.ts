import { HAND, type HandLandmarks } from '@/types/landmarks';

export type SwipeDirection = 'left' | 'right' | null;

interface WristSample {
  x: number;
  t: number;
}

/**
 * Velocity-based horizontal swipe detector.
 *
 * Tracks the wrist x-position over a short time window and fires when the
 * average horizontal velocity exceeds a threshold. A cooldown prevents a
 * single physical swipe from firing repeatedly.
 *
 * Note: x is in normalized image space. Because the preview is mirrored for
 * a selfie view, callers may flip the reported direction; this module reports
 * raw image-space direction and leaves mirroring to the consumer.
 */
export class SwipeDetector {
  private readonly windowMs: number;
  private readonly velocityThreshold: number;
  private readonly cooldownMs: number;
  private samples: WristSample[] = [];
  private lastFireTime = -Infinity;

  constructor(opts?: {
    windowMs?: number;
    velocityThreshold?: number;
    cooldownMs?: number;
  }) {
    this.windowMs = opts?.windowMs ?? 250;
    // Normalized units per second. ~1.2 means crossing most of the frame/sec.
    this.velocityThreshold = opts?.velocityThreshold ?? 1.2;
    this.cooldownMs = opts?.cooldownMs ?? 600;
  }

  /**
   * Push a new hand observation.
   * @returns a direction when a swipe fires this frame, otherwise null.
   */
  push(hand: HandLandmarks, timestamp: number): SwipeDirection {
    const wrist = hand[HAND.WRIST];
    if (!wrist) return null;

    this.samples.push({ x: wrist.x, t: timestamp });
    // Drop samples older than the window.
    const cutoff = timestamp - this.windowMs;
    this.samples = this.samples.filter((s) => s.t >= cutoff);

    if (this.samples.length < 2) return null;
    if (timestamp - this.lastFireTime < this.cooldownMs) return null;

    const first = this.samples[0]!;
    const last = this.samples[this.samples.length - 1]!;
    const dt = (last.t - first.t) / 1000;
    if (dt <= 0) return null;

    const velocity = (last.x - first.x) / dt; // normalized units / s

    if (Math.abs(velocity) >= this.velocityThreshold) {
      this.lastFireTime = timestamp;
      this.samples = [];
      return velocity > 0 ? 'right' : 'left';
    }
    return null;
  }

  reset(): void {
    this.samples = [];
    this.lastFireTime = -Infinity;
  }
}
