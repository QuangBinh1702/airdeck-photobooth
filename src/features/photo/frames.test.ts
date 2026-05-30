import { describe, expect, it } from 'vitest';
import {
  FRAMES,
  computeFrameMetrics,
  getFrameById,
} from '@/features/photo/frames';

describe('frames catalog', () => {
  it('has unique ids and includes a no-frame option', () => {
    const ids = FRAMES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('none');
  });

  it('falls back to the first frame for unknown ids', () => {
    expect(getFrameById('nope').id).toBe('none');
  });
});

describe('computeFrameMetrics', () => {
  it('adds border on all sides and a footer for a decorative frame', () => {
    const frame = getFrameById('classic-white');
    const m = computeFrameMetrics(frame, 1000, 1000);
    const border = Math.round(1000 * frame.borderRatio);
    const footer = Math.round(1000 * frame.footerRatio);
    expect(m.border).toBe(border);
    expect(m.footer).toBe(footer);
    expect(m.outerWidth).toBe(1000 + border * 2);
    expect(m.outerHeight).toBe(1000 + border * 2 + footer);
    expect(m.photo).toEqual({ x: border, y: border, width: 1000, height: 1000 });
  });

  it('produces a same-size canvas for the no-frame option', () => {
    const m = computeFrameMetrics(getFrameById('none'), 640, 480);
    expect(m.outerWidth).toBe(640);
    expect(m.outerHeight).toBe(480);
    expect(m.border).toBe(0);
    expect(m.footer).toBe(0);
  });

  it('uses the shorter edge for border thickness', () => {
    const frame = getFrameById('film-black');
    const m = computeFrameMetrics(frame, 1920, 1080);
    expect(m.border).toBe(Math.round(1080 * frame.borderRatio));
  });

  it('throws on non-positive dimensions', () => {
    expect(() => computeFrameMetrics(getFrameById('none'), 0, 100)).toThrow(
      RangeError,
    );
  });
});
