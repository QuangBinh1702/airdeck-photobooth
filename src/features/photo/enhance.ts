/**
 * Lightweight auto image enhancement to reduce the impact of poor ambient
 * lighting. Operates on raw RGBA pixel data (from a canvas) so it is pure and
 * unit-testable.
 *
 * Pipeline:
 *  1. Auto white balance (gray-world): neutralize colour casts from warm/cool
 *     room lighting by equalizing the average R/G/B.
 *  2. Auto levels / contrast stretch: map the luminance range to near full
 *     range using robust percentiles (ignores a few outlier pixels).
 *  3. Gentle brightness lift in shadows when the image is underexposed.
 *
 * The strength is intentionally conservative so faces stay natural, not "HDR".
 */

export interface EnhanceOptions {
  /** 0 = no change, 1 = full correction. Default 0.7 (subtle but effective). */
  strength?: number;
  /** Percentile clipped at each end for the contrast stretch (0..0.2). */
  clip?: number;
}

/** Clamp to a valid 8-bit channel value. */
function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Rec. 601 luma. */
export function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Compute white-balance gains (gray-world) from channel averages.
 * Exported for testing.
 */
export function grayWorldGains(
  avgR: number,
  avgG: number,
  avgB: number,
): { gainR: number; gainG: number; gainB: number } {
  const gray = (avgR + avgG + avgB) / 3;
  const safe = (avg: number) => (avg <= 0 ? 1 : gray / avg);
  return { gainR: safe(avgR), gainG: safe(avgG), gainB: safe(avgB) };
}

/** Find low/high luminance cut points from a 256-bin histogram + clip fraction. */
export function levelsFromHistogram(
  hist: number[],
  total: number,
  clip: number,
): { lo: number; hi: number } {
  if (total <= 0) return { lo: 0, hi: 255 };
  const clipCount = total * clip;
  let lo = 0;
  let hi = 255;
  let acc = 0;
  for (let i = 0; i < 256; i += 1) {
    acc += hist[i] ?? 0;
    if (acc > clipCount) {
      lo = i;
      break;
    }
  }
  acc = 0;
  for (let i = 255; i >= 0; i -= 1) {
    acc += hist[i] ?? 0;
    if (acc > clipCount) {
      hi = i;
      break;
    }
  }
  if (hi <= lo) {
    lo = 0;
    hi = 255;
  }
  return { lo, hi };
}

/**
 * Enhance an ImageData in place and return it. Safe on empty data.
 */
export function enhanceImageData(
  image: ImageData,
  options: EnhanceOptions = {},
): ImageData {
  const strength = Math.min(1, Math.max(0, options.strength ?? 0.7));
  const clip = Math.min(0.2, Math.max(0, options.clip ?? 0.02));
  const data = image.data;
  const n = data.length;
  if (n === 0 || strength === 0) return image;

  // Pass 1: channel sums + luma histogram.
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const pixels = n / 4;
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < n; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    sumR += r;
    sumG += g;
    sumB += b;
    const bin = Math.round(luma(r, g, b));
    hist[bin] = (hist[bin] ?? 0) + 1;
  }
  const avgR = sumR / pixels;
  const avgG = sumG / pixels;
  const avgB = sumB / pixels;

  const { gainR, gainG, gainB } = grayWorldGains(avgR, avgG, avgB);
  const { lo, hi } = levelsFromHistogram(hist, pixels, clip);
  const range = hi - lo || 1;
  const scale = 255 / range;

  // Blend factor: apply correction proportionally to `strength`.
  const mix = (orig: number, corrected: number) =>
    orig + (corrected - orig) * strength;

  for (let i = 0; i < n; i += 4) {
    // White balance.
    let r = data[i]! * gainR;
    let g = data[i + 1]! * gainG;
    let b = data[i + 2]! * gainB;
    // Levels stretch (same mapping per channel keeps colour ratios stable).
    r = (r - lo) * scale;
    g = (g - lo) * scale;
    b = (b - lo) * scale;

    data[i] = clamp8(mix(data[i]!, r));
    data[i + 1] = clamp8(mix(data[i + 1]!, g));
    data[i + 2] = clamp8(mix(data[i + 2]!, b));
    // alpha (i+3) untouched
  }
  return image;
}
