import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STRIP_CONFIG,
  cellCount,
  computeCells,
  coverCrop,
  type StripConfig,
} from '@/features/photo/photoStrip';

describe('cellCount', () => {
  it('returns 4 for both supported layouts', () => {
    expect(cellCount('vertical-4')).toBe(4);
    expect(cellCount('grid-2x2')).toBe(4);
  });
});

describe('computeCells vertical-4', () => {
  it('produces 4 stacked, equal, non-overlapping cells inside the margins', () => {
    const cells = computeCells(DEFAULT_STRIP_CONFIG);
    expect(cells).toHaveLength(4);

    const { width, margin, gap } = DEFAULT_STRIP_CONFIG;
    // All cells share full inner width and x = margin.
    for (const cell of cells) {
      expect(cell.x).toBe(margin);
      expect(cell.width).toBe(width - margin * 2);
      expect(cell.height).toBeGreaterThan(0);
    }
    // Cells are stacked with the configured gap.
    for (let i = 1; i < cells.length; i += 1) {
      const prev = cells[i - 1]!;
      const cur = cells[i]!;
      expect(cur.y).toBeCloseTo(prev.y + prev.height + gap, 5);
    }
  });

  it('keeps the last cell above the footer area', () => {
    const cfg = DEFAULT_STRIP_CONFIG;
    const cells = computeCells(cfg);
    const last = cells[cells.length - 1]!;
    const bottom = last.y + last.height;
    expect(bottom).toBeLessThanOrEqual(cfg.height - cfg.margin - cfg.footer + 0.001);
  });
});

describe('computeCells grid-2x2', () => {
  it('produces a 2x2 grid', () => {
    const cfg: StripConfig = { ...DEFAULT_STRIP_CONFIG, layout: 'grid-2x2' };
    const cells = computeCells(cfg);
    expect(cells).toHaveLength(4);
    // Row 0 and row 1 share y; col 0 and col 1 share x.
    expect(cells[0]!.y).toBe(cells[1]!.y);
    expect(cells[2]!.y).toBe(cells[3]!.y);
    expect(cells[0]!.x).toBe(cells[2]!.x);
    expect(cells[1]!.x).toBe(cells[3]!.x);
  });
});

describe('computeCells validation', () => {
  it('throws when the inner area collapses', () => {
    const cfg: StripConfig = { ...DEFAULT_STRIP_CONFIG, margin: 1000 };
    expect(() => computeCells(cfg)).toThrow(RangeError);
  });
});

describe('coverCrop', () => {
  it('crops the sides of a wide source for a square cell', () => {
    const crop = coverCrop(1920, 1080, { x: 0, y: 0, width: 100, height: 100 });
    // Square target => crop width down to match height.
    expect(crop.height).toBe(1080);
    expect(crop.width).toBeCloseTo(1080, 5);
    expect(crop.x).toBeCloseTo((1920 - 1080) / 2, 5);
    expect(crop.y).toBe(0);
  });

  it('crops top/bottom of a tall source for a wide cell', () => {
    const crop = coverCrop(1080, 1920, { x: 0, y: 0, width: 200, height: 100 });
    expect(crop.width).toBe(1080);
    expect(crop.height).toBeCloseTo(540, 5);
    expect(crop.y).toBeCloseTo((1920 - 540) / 2, 5);
  });

  it('throws on non-positive source dimensions', () => {
    expect(() =>
      coverCrop(0, 100, { x: 0, y: 0, width: 10, height: 10 }),
    ).toThrow(RangeError);
  });
});
