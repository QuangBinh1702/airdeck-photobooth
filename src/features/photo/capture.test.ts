import { describe, expect, it, vi } from 'vitest';
import { capturePhoto } from '@/features/photo/capture';

interface FakeCtx {
  filter: string;
  ops: string[];
}

function makeCanvas(ctx: FakeCtx | null): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext: () =>
      ctx
        ? ({
            save: () => ctx.ops.push('save'),
            restore: () => ctx.ops.push('restore'),
            translate: () => ctx.ops.push('translate'),
            scale: () => ctx.ops.push('scale'),
            drawImage: () => ctx.ops.push('drawImage'),
            set filter(v: string) {
              ctx.filter = v;
            },
            get filter() {
              return ctx.filter;
            },
          } as unknown as CanvasRenderingContext2D)
        : null,
    toDataURL: vi.fn(() => 'data:image/png;base64,FAKE'),
  } as unknown as HTMLCanvasElement;
}

function makeVideo(w: number, h: number): HTMLVideoElement {
  return { videoWidth: w, videoHeight: h } as HTMLVideoElement;
}

describe('capturePhoto', () => {
  it('returns a data URL and sizes the canvas to the video', () => {
    const ctx: FakeCtx = { filter: 'none', ops: [] };
    const canvas = makeCanvas(ctx);
    const video = makeVideo(640, 480);

    const url = capturePhoto(video, canvas, 'grayscale(1)');
    expect(url).toBe('data:image/png;base64,FAKE');
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(ctx.ops).toContain('drawImage');
  });

  it('mirrors by default (applies translate + scale)', () => {
    const ctx: FakeCtx = { filter: 'none', ops: [] };
    const canvas = makeCanvas(ctx);
    capturePhoto(makeVideo(100, 100), canvas, 'none', { mirror: true });
    expect(ctx.ops).toContain('translate');
    expect(ctx.ops).toContain('scale');
  });

  it('skips mirroring when disabled', () => {
    const ctx: FakeCtx = { filter: 'none', ops: [] };
    const canvas = makeCanvas(ctx);
    capturePhoto(makeVideo(100, 100), canvas, 'none', { mirror: false });
    expect(ctx.ops).not.toContain('scale');
  });

  it('returns null when the video has no dimensions', () => {
    const canvas = makeCanvas({ filter: 'none', ops: [] });
    expect(capturePhoto(makeVideo(0, 0), canvas)).toBeNull();
  });

  it('returns null when 2D context is unavailable', () => {
    const canvas = makeCanvas(null);
    expect(capturePhoto(makeVideo(100, 100), canvas)).toBeNull();
  });
});
