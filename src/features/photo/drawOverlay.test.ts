import { describe, expect, it } from 'vitest';
import {
  clearCanvas,
  drawHandSkeleton,
  drawShape,
  type DrawOptions,
} from '@/features/photo/drawOverlay';
import type { ShapeOverlay } from '@/features/photo/gestureShapes';
import { makeOpenHand } from '@/test/handFixtures';

interface Rec {
  ops: string[];
  arcs: [number, number, number][];
  moves: [number, number][];
}

function makeCtx(rec: Rec): CanvasRenderingContext2D {
  return {
    lineWidth: 0,
    strokeStyle: '',
    fillStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    save: () => rec.ops.push('save'),
    restore: () => rec.ops.push('restore'),
    beginPath: () => rec.ops.push('beginPath'),
    closePath: () => rec.ops.push('closePath'),
    moveTo: (x: number, y: number) => rec.moves.push([x, y]),
    lineTo: () => rec.ops.push('lineTo'),
    stroke: () => rec.ops.push('stroke'),
    fill: () => rec.ops.push('fill'),
    arc: (x: number, y: number, r: number) => rec.arcs.push([x, y, r]),
    clearRect: () => rec.ops.push('clearRect'),
  } as unknown as CanvasRenderingContext2D;
}

const opts: DrawOptions = { width: 200, height: 100, mirror: true };

function newRec(): Rec {
  return { ops: [], arcs: [], moves: [] };
}

describe('clearCanvas', () => {
  it('clears the full canvas', () => {
    const rec = newRec();
    clearCanvas(makeCtx(rec), opts);
    expect(rec.ops).toContain('clearRect');
  });
});

describe('drawHandSkeleton', () => {
  it('draws connection strokes and landmark dots', () => {
    const rec = newRec();
    drawHandSkeleton(makeCtx(rec), makeOpenHand(), opts);
    expect(rec.ops.filter((o) => o === 'stroke').length).toBeGreaterThan(5);
    // 21 landmark dots => 21 arcs.
    expect(rec.arcs.length).toBe(21);
  });

  it('mirrors X coordinates when mirror is true', () => {
    const rec = newRec();
    drawHandSkeleton(makeCtx(rec), makeOpenHand(), opts);
    // First moveTo is the first connection start (wrist at x=0.5 -> mirror 0.5*200=100).
    expect(rec.moves[0]![0]).toBeCloseTo((1 - 0.5) * 200, 5);
  });
});

describe('drawShape', () => {
  it('draws a circle via arc', () => {
    const rec = newRec();
    const shape: ShapeOverlay = {
      type: 'circle',
      label: 'Vòng tròn',
      emoji: '⭕',
      points: [],
      center: { x: 0.5, y: 0.5 },
      radius: 0.2,
    };
    drawShape(makeCtx(rec), shape, opts);
    expect(rec.arcs.length).toBe(1);
    expect(rec.ops).toContain('fill');
    expect(rec.ops).toContain('stroke');
  });

  it('draws a polygon for triangle/quad shapes', () => {
    const rec = newRec();
    const shape: ShapeOverlay = {
      type: 'triangle',
      label: 'Tam giác',
      emoji: '🔺',
      points: [
        { x: 0.1, y: 0.1 },
        { x: 0.3, y: 0.1 },
        { x: 0.2, y: 0.3 },
      ],
    };
    drawShape(makeCtx(rec), shape, opts);
    expect(rec.ops).toContain('closePath');
    expect(rec.ops.filter((o) => o === 'lineTo').length).toBe(2);
    expect(rec.moves.length).toBe(1);
  });
});
