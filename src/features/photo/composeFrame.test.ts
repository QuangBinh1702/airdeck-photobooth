import { describe, expect, it, vi } from 'vitest';
import { composeFramedPhoto, paintBackground } from '@/features/photo/composeFrame';

interface Recorder {
  fillStyle: unknown;
  strokeStyle: unknown;
  lineWidth: number;
  font: string;
  textAlign: string;
  textBaseline: string;
  ops: string[];
  gradientStops: [number, string][];
}

function makeCtx(rec: Recorder): CanvasRenderingContext2D {
  return {
    set fillStyle(v: unknown) {
      rec.fillStyle = v;
    },
    get fillStyle() {
      return rec.fillStyle;
    },
    set strokeStyle(v: unknown) {
      rec.strokeStyle = v;
    },
    get strokeStyle() {
      return rec.strokeStyle;
    },
    set lineWidth(v: number) {
      rec.lineWidth = v;
    },
    get lineWidth() {
      return rec.lineWidth;
    },
    set font(v: string) {
      rec.font = v;
    },
    get font() {
      return rec.font;
    },
    textAlign: rec.textAlign,
    textBaseline: rec.textBaseline,
    fillRect: () => rec.ops.push('fillRect'),
    strokeRect: () => rec.ops.push('strokeRect'),
    drawImage: () => rec.ops.push('drawImage'),
    fillText: () => rec.ops.push('fillText'),
    createLinearGradient: () => ({
      addColorStop: (offset: number, color: string) =>
        rec.gradientStops.push([offset, color]),
    }),
  } as unknown as CanvasRenderingContext2D;
}

function newRecorder(): Recorder {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    ops: [],
    gradientStops: [],
  };
}

function makeCanvas(rec: Recorder | null): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext: () => (rec ? makeCtx(rec) : null),
    toDataURL: vi.fn(() => 'data:image/png;base64,FRAMED'),
  } as unknown as HTMLCanvasElement;
}

function makeImage(w: number, h: number): HTMLImageElement {
  return { naturalWidth: w, naturalHeight: h, width: w, height: h } as HTMLImageElement;
}

describe('paintBackground', () => {
  it('skips painting for transparent', () => {
    const rec = newRecorder();
    paintBackground(makeCtx(rec), 'transparent', 10, 10);
    expect(rec.ops).not.toContain('fillRect');
  });

  it('paints a solid color', () => {
    const rec = newRecorder();
    paintBackground(makeCtx(rec), '#ff0000', 10, 10);
    expect(rec.fillStyle).toBe('#ff0000');
    expect(rec.ops).toContain('fillRect');
  });

  it('parses a linear-gradient into color stops', () => {
    const rec = newRecorder();
    paintBackground(makeCtx(rec), 'linear-gradient(135deg,#5eead4,#a78bfa)', 100, 100);
    expect(rec.gradientStops).toEqual([
      [0, '#5eead4'],
      [1, '#a78bfa'],
    ]);
    expect(rec.ops).toContain('fillRect');
  });
});

describe('composeFramedPhoto', () => {
  it('composes a decorative frame: background + photo + border + caption', () => {
    const rec = newRecorder();
    const canvas = makeCanvas(rec);
    const url = composeFramedPhoto(makeImage(800, 600), canvas, 'classic-white');
    expect(url).toBe('data:image/png;base64,FRAMED');
    expect(rec.ops).toContain('fillRect'); // background
    expect(rec.ops).toContain('drawImage'); // photo
    expect(rec.ops).toContain('strokeRect'); // inner border
    expect(rec.ops).toContain('fillText'); // caption
    // Canvas grew to include border + footer.
    expect(canvas.width).toBeGreaterThan(800);
    expect(canvas.height).toBeGreaterThan(600);
  });

  it('uses a custom caption when provided', () => {
    const rec = newRecorder();
    const canvas = makeCanvas(rec);
    composeFramedPhoto(makeImage(400, 400), canvas, 'mint', {
      caption: 'Hello',
    });
    expect(rec.ops).toContain('fillText');
  });

  it('no-frame option keeps the original size and draws the photo only', () => {
    const rec = newRecorder();
    const canvas = makeCanvas(rec);
    composeFramedPhoto(makeImage(640, 480), canvas, 'none');
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(rec.ops).toContain('drawImage');
    expect(rec.ops).not.toContain('strokeRect');
  });

  it('returns null when the image has no dimensions', () => {
    const canvas = makeCanvas(newRecorder());
    expect(composeFramedPhoto(makeImage(0, 0), canvas, 'mint')).toBeNull();
  });

  it('returns null when 2D context is unavailable', () => {
    const canvas = makeCanvas(null);
    expect(composeFramedPhoto(makeImage(100, 100), canvas, 'mint')).toBeNull();
  });
});
