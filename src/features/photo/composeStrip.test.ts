import { describe, expect, it, vi } from 'vitest';
import { composeStrip } from '@/features/photo/composeStrip';

interface Rec {
  ops: string[];
  drawImages: number;
  gradientStops: [number, string][];
  fillText: string[];
}

function makeCtx(rec: Rec): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: () => rec.ops.push('fillRect'),
    strokeRect: () => rec.ops.push('strokeRect'),
    drawImage: () => {
      rec.drawImages += 1;
    },
    fillText: (t: string) => rec.fillText.push(t),
    createLinearGradient: () => ({
      addColorStop: (o: number, c: string) => rec.gradientStops.push([o, c]),
    }),
  } as unknown as CanvasRenderingContext2D;
}

function newRec(): Rec {
  return { ops: [], drawImages: 0, gradientStops: [], fillText: [] };
}

function makeCanvas(rec: Rec | null): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext: () => (rec ? makeCtx(rec) : null),
    toDataURL: vi.fn(() => 'data:image/png;base64,STRIP'),
  } as unknown as HTMLCanvasElement;
}

function img(w = 1280, h = 720): HTMLImageElement {
  return { naturalWidth: w, naturalHeight: h, width: w, height: h } as HTMLImageElement;
}

describe('composeStrip', () => {
  it('returns null when there are no images', () => {
    expect(composeStrip([], makeCanvas(newRec()))).toBeNull();
  });

  it('returns null when 2D context is unavailable', () => {
    expect(composeStrip([img()], makeCanvas(null))).toBeNull();
  });

  it('draws one image per provided photo (vertical-4)', () => {
    const rec = newRec();
    const canvas = makeCanvas(rec);
    const url = composeStrip([img(), img(), img(), img()], canvas, {
      layout: 'vertical-4',
      themeId: 'classic-white',
    });
    expect(url).toBe('data:image/png;base64,STRIP');
    expect(rec.drawImages).toBe(4);
    // 600x1800 default vertical strip.
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(1800);
  });

  it('ignores extra images beyond strip capacity (4)', () => {
    const rec = newRec();
    composeStrip([img(), img(), img(), img(), img(), img()], makeCanvas(rec), {
      layout: 'grid-2x2',
    });
    expect(rec.drawImages).toBe(4);
  });

  it('leaves missing cells empty when fewer images are given', () => {
    const rec = newRec();
    composeStrip([img(), img()], makeCanvas(rec), { layout: 'vertical-4' });
    expect(rec.drawImages).toBe(2);
  });

  it('paints a gradient background for gradient themes', () => {
    const rec = newRec();
    composeStrip([img()], makeCanvas(rec), { themeId: 'mint' });
    expect(rec.gradientStops.length).toBeGreaterThanOrEqual(2);
  });

  it('renders a custom caption', () => {
    const rec = newRec();
    composeStrip([img()], makeCanvas(rec), { caption: 'My Strip' });
    expect(rec.fillText).toContain('My Strip');
  });

  it('uses a square canvas for grid-2x2', () => {
    const rec = newRec();
    const canvas = makeCanvas(rec);
    composeStrip([img(), img(), img(), img()], canvas, { layout: 'grid-2x2' });
    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(1000);
  });
});
