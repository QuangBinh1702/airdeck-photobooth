import { describe, expect, it } from 'vitest';
import {
  ACCESSORIES,
  getAccessoryById,
  placeAccessory,
} from '@/features/photo/accessories';
import { computeFaceAnchors } from '@/features/photo/faceAnchors';
import { makeFace } from '@/test/faceFixtures';

const face = computeFaceAnchors(makeFace())!;

describe('accessory catalog', () => {
  it('has unique ids, picker icons and vector renderers', () => {
    const ids = ACCESSORIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    ACCESSORIES.forEach((a) => {
      expect(a.icon.length).toBeGreaterThan(0);
      expect(typeof a.render).toBe('function');
    });
  });

  it('resolves an accessory by id', () => {
    expect(getAccessoryById('glasses')?.label).toBe('Kính');
    expect(getAccessoryById('nope')).toBeUndefined();
  });
});

describe('placeAccessory', () => {
  it('places glasses at the eye center, unit = eye distance', () => {
    const g = getAccessoryById('glasses')!;
    const p = placeAccessory(g, face);
    expect(p.id).toBe('glasses');
    // offsetY nudges slightly down the face axis; x stays centered.
    expect(p.x).toBeCloseTo(face.eyeCenter.x, 5);
    expect(p.unit).toBeCloseTo(face.eyeDistance * g.scale, 5);
  });

  it('places a hat above the head (higher than the forehead)', () => {
    const hat = getAccessoryById('tophat')!;
    const p = placeAccessory(hat, face);
    expect(p.y).toBeLessThan(face.foreheadTop.y);
    // Hats are sized by face width.
    expect(p.unit).toBeCloseTo(face.faceWidth * hat.scale, 5);
  });

  it('places the mustache between nose and mouth', () => {
    const m = getAccessoryById('mustache')!;
    const p = placeAccessory(m, face);
    // mouth anchor with a negative (upward) offset -> above the mouth.
    expect(p.y).toBeLessThan(face.mouthTop.y);
    expect(p.y).toBeGreaterThan(face.eyeCenter.y);
  });

  it('carries the head roll into the placement rotation', () => {
    const rolled = computeFaceAnchors(makeFace({ roll: 0.3 }))!;
    const p = placeAccessory(getAccessoryById('glasses')!, rolled);
    expect(p.rotation).toBeCloseTo(0.3, 4);
  });

  it('shifts the anchor along the rolled face down-axis for offsets', () => {
    // With roll, a vertical offset should move along the tilted axis (x moves).
    const rolled = computeFaceAnchors(makeFace({ roll: 0.4 }))!;
    const p = placeAccessory(getAccessoryById('glasses')!, rolled);
    expect(p.x).not.toBeCloseTo(rolled.eyeCenter.x, 6);
  });
});
