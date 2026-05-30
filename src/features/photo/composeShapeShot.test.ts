import { describe, expect, it, vi } from 'vitest';
import { composeShapeShot } from '@/features/photo/composeShapeShot';
import type { ShapeOverlay } from '@/features/photo/gestureShapes';

interface Rec {
  ops: string[];
  drawImages: number;
  arcs: number;
  clips: number;
  strokes: number;
}

function makeCtx(rec: Rec): CanvasRenderingContext2D {
  return {
    strokeStyle: '',
    lineWidth: 0,
    shadowColor: '',
    shadowBlur: 0,
    save: () => rec.ops.push('save'),
    restore: () => rec.ops.push('restore'),
    beginPath: () => rec.ops.push('beginPath'),
    closePath: () => rec.ops.push('closePath'),
    moveTo: () => rec.ops.push('moveTo'),
    lineTo: () => rec.ops.push('lineTo'),
    arc: () => {
      rec.arcs += 1;
    },
    clip: () => {
      rec.clips += 1;
    },
    stroke: () => {
      rec.strokes += 1;
    },
    drawImage: () => {
      rec.drawImages += 1;
    },
  } as unknown as CanvasRenderingContext2D;
}

function newRec(): Rec {
  return { ops: [], drawImages: 0, arcs: 0, clips: 0, strokes: 0 };
}

function makeCanvas(rec: Rec | null): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext: () => (rec ? makeCtx(rec) : null),
    toDataURL: vi.fn(() => 'data:image/png;base64,SHAPESHOT'),
  } as unknown as HTMLCanvasElement;
}

function img(w = 1280, h = 720): HTMLImageElement {
  return { naturalWidth: w, naturalHeight: h, width: w, height: h } as HTMLImageElement;
}

const quad: ShapeOverlay = {
  type: 'quad',
  label: 'Khung 3D',
  emoji: '🔲',
  points: [
    { x: 0.3, y: 0.3 },
    { x: 0.7, y: 0.3 },
    { x: 0.7, y: 0.7 },
    { x: 0.3, y: 0.7 },
  ],
};

const circle: ShapeOverlay = {
  type: 'circle',
  label: 'Vòng tròn',
  emoji: '⭕',
  points: [],
  center: { x: 0.5, y: 0.5 },
  radius: 0.2,
};

describe('composeShapeShot', () => {
  it('draws background then a clipped inset (two drawImage calls)', () => {
    const rec = newRec();
    const canvas = makeCanvas(rec);
    const url = composeShapeShot(img(), img(), canvas, quad);
    expect(url).toBe('data:image/png;base64,SHAPESHOT');
    expect(rec.drawImages).toBe(2); // background + inset
    expect(rec.clips).toBe(1); // inset is clipped to the shape
    expect(rec.strokes).toBe(1); // outline drawn
  });

  it('sizes the canvas to the background image', () => {
    const rec = newRec();
    const canvas = makeCanvas(rec);
    composeShapeShot(img(800, 600), img(800, 600), canvas, quad);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it('uses an arc for circular shapes', () => {
    const rec = newRec();
    composeShapeShot(img(), img(), makeCanvas(rec), circle);
    // clip path + outline path both use arc -> 2 arcs.
    expect(rec.arcs).toBe(2);
  });

  it('returns null when background has no dimensions', () => {
    expect(composeShapeShot(img(0, 0), img(), makeCanvas(newRec()), quad)).toBeNull();
  });

  it('returns null when 2D context is unavailable', () => {
    expect(composeShapeShot(img(), img(), makeCanvas(null), quad)).toBeNull();
  });
});
