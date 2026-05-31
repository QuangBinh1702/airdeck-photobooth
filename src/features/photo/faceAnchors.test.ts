import { describe, expect, it } from 'vitest';
import { computeFaceAnchors } from '@/features/photo/faceAnchors';
import { makeFace } from '@/test/faceFixtures';

describe('computeFaceAnchors', () => {
  it('returns null for an empty / incomplete face', () => {
    expect(computeFaceAnchors([])).toBeNull();
  });

  it('computes eye center, distances and zero roll for a level face', () => {
    const a = computeFaceAnchors(makeFace())!;
    expect(a).not.toBeNull();
    expect(a.eyeCenter.x).toBeCloseTo(0.5, 5);
    expect(a.eyeCenter.y).toBeCloseTo(0.45, 5);
    expect(a.eyeDistance).toBeCloseTo(0.2, 5); // eyes 0.1 either side
    expect(a.faceWidth).toBeCloseTo(0.3, 5); // cheeks 0.35..0.65
    expect(a.rollRad).toBeCloseTo(0, 5);
  });

  it('detects head roll from the eye line', () => {
    const a = computeFaceAnchors(makeFace({ roll: Math.PI / 12 }))!; // 15°
    expect(a.rollRad).toBeCloseTo(Math.PI / 12, 4);
  });

  it('exposes nose / forehead / mouth anchors', () => {
    const a = computeFaceAnchors(makeFace())!;
    expect(a.foreheadTop.y).toBeLessThan(a.eyeCenter.y); // forehead above eyes
    expect(a.noseBottom.y).toBeGreaterThan(a.eyeCenter.y); // nose below eyes
    expect(a.mouthTop.y).toBeGreaterThan(a.noseBottom.y); // mouth below nose
  });
});
