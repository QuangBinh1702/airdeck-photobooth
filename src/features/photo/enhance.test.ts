import { describe, expect, it } from 'vitest';
import {
  enhanceImageData,
  grayWorldGains,
  levelsFromHistogram,
  luma,
} from '@/features/photo/enhance';

/** Build a fake ImageData from a flat RGBA array (jsdom lacks ImageData ctor). */
function makeImageData(rgba: number[]): ImageData {
  return {
    data: new Uint8ClampedArray(rgba),
    width: rgba.length / 4,
    height: 1,
    colorSpace: 'srgb',
  } as ImageData;
}

describe('luma', () => {
  it('weights green most, blue least', () => {
    expect(luma(255, 0, 0)).toBeCloseTo(76.245, 1);
    expect(luma(0, 255, 0)).toBeCloseTo(149.685, 1);
    expect(luma(0, 0, 255)).toBeCloseTo(29.07, 1);
  });
});

describe('grayWorldGains', () => {
  it('returns gains that neutralize a colour cast', () => {
    // Warm image (more red): gain on red < 1, gain on blue > 1.
    const { gainR, gainG, gainB } = grayWorldGains(200, 100, 50);
    expect(gainR).toBeLessThan(1);
    expect(gainB).toBeGreaterThan(1);
    expect(gainG).toBeCloseTo(((200 + 100 + 50) / 3) / 100, 5);
  });

  it('is identity for an already-neutral image', () => {
    const g = grayWorldGains(120, 120, 120);
    expect(g.gainR).toBeCloseTo(1, 5);
    expect(g.gainG).toBeCloseTo(1, 5);
    expect(g.gainB).toBeCloseTo(1, 5);
  });

  it('handles a zero channel without dividing by zero', () => {
    const g = grayWorldGains(0, 100, 100);
    expect(Number.isFinite(g.gainR)).toBe(true);
  });
});

describe('levelsFromHistogram', () => {
  it('finds the populated range with no clipping', () => {
    const hist = new Array<number>(256).fill(0);
    hist[50] = 10;
    hist[200] = 10;
    const { lo, hi } = levelsFromHistogram(hist, 20, 0);
    expect(lo).toBeLessThanOrEqual(50);
    expect(hi).toBeGreaterThanOrEqual(200);
  });

  it('returns the full range for an empty histogram', () => {
    const { lo, hi } = levelsFromHistogram(new Array(256).fill(0), 0, 0.02);
    expect(lo).toBe(0);
    expect(hi).toBe(255);
  });
});

describe('enhanceImageData', () => {
  it('brightens / stretches a dull low-contrast image', () => {
    // All mid-gray pixels squeezed into a narrow band -> should spread out.
    const rgba: number[] = [];
    for (let i = 0; i < 16; i += 1) rgba.push(100, 100, 100, 255);
    const out = enhanceImageData(makeImageData(rgba), { strength: 1, clip: 0 });
    // Uniform input stays uniform but is remapped; should not crash and alpha
    // preserved.
    expect(out.data[3]).toBe(255);
  });

  it('does nothing when strength is 0', () => {
    const rgba = [10, 20, 30, 255, 40, 50, 60, 255];
    const out = enhanceImageData(makeImageData([...rgba]), { strength: 0 });
    expect(Array.from(out.data)).toEqual(rgba);
  });

  it('corrects a warm colour cast toward neutral', () => {
    // Strong red cast across the image.
    const rgba: number[] = [];
    for (let i = 0; i < 8; i += 1) rgba.push(200, 120, 120, 255);
    const out = enhanceImageData(makeImageData(rgba), { strength: 1, clip: 0 });
    // After white balance the red channel should be pulled down relative to
    // its original 200.
    expect(out.data[0]!).toBeLessThan(200);
  });

  it('keeps alpha channel untouched', () => {
    const out = enhanceImageData(
      makeImageData([10, 20, 30, 128]),
      { strength: 1 },
    );
    expect(out.data[3]).toBe(128);
  });

  it('is safe on empty data', () => {
    const out = enhanceImageData(makeImageData([]));
    expect(out.data.length).toBe(0);
  });
});
