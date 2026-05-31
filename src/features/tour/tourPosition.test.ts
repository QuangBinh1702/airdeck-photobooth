import { describe, expect, it } from 'vitest';
import { positionTooltip, type Rect } from '@/features/tour/tourPosition';

const vp = { width: 1000, height: 800 };
const tip = { width: 320, height: 200 };

describe('positionTooltip', () => {
  it('centers when there is no target', () => {
    const r = positionTooltip(null, tip, vp, 'bottom');
    expect(r.placement).toBe('center');
    expect(r.left).toBeCloseTo((vp.width - tip.width) / 2, 5);
    expect(r.top).toBeCloseTo((vp.height - tip.height) / 2, 5);
  });

  it('centers when placement is center', () => {
    const target: Rect = { top: 10, left: 10, width: 100, height: 50 };
    expect(positionTooltip(target, tip, vp, 'center').placement).toBe('center');
  });

  it('places below a target with room underneath', () => {
    const target: Rect = { top: 100, left: 400, width: 100, height: 40 };
    const r = positionTooltip(target, tip, vp, 'bottom');
    expect(r.placement).toBe('bottom');
    expect(r.top).toBe(100 + 40 + 12);
  });

  it('flips to top when there is no room below', () => {
    const target: Rect = { top: 700, left: 400, width: 100, height: 60 };
    const r = positionTooltip(target, tip, vp, 'bottom');
    expect(r.placement).toBe('top');
    expect(r.top).toBe(700 - tip.height - 12);
  });

  it('flips to bottom when there is no room above', () => {
    const target: Rect = { top: 20, left: 400, width: 100, height: 40 };
    const r = positionTooltip(target, tip, vp, 'top');
    expect(r.placement).toBe('bottom');
  });

  it('clamps horizontally so the tooltip stays in the viewport', () => {
    const target: Rect = { top: 100, left: 980, width: 20, height: 20 };
    const r = positionTooltip(target, tip, vp, 'bottom');
    expect(r.left).toBeLessThanOrEqual(vp.width - tip.width - 12 + 0.001);
    expect(r.left).toBeGreaterThanOrEqual(12);
  });

  it('places to the right and left when requested with room', () => {
    const target: Rect = { top: 300, left: 100, width: 80, height: 80 };
    expect(positionTooltip(target, tip, vp, 'right').placement).toBe('right');
    const wide: Rect = { top: 300, left: 600, width: 80, height: 80 };
    expect(positionTooltip(wide, tip, vp, 'left').placement).toBe('left');
  });
});
