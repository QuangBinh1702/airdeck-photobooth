import { describe, expect, it, vi } from 'vitest';
import { coverSourceRect, drawImageCover } from '@/features/photo/drawCover';

describe('coverSourceRect', () => {
  it('crops the left and right edges when a wide source covers a narrow target', () => {
    expect(coverSourceRect(1920, 1080, 390, 520)).toEqual({
      sx: 555,
      sy: 0,
      sw: 810,
      sh: 1080,
    });
  });

  it('crops the top and bottom edges when a tall source covers a wide target', () => {
    expect(coverSourceRect(1080, 1920, 520, 390)).toEqual({
      sx: 0,
      sy: 555,
      sw: 1080,
      sh: 810,
    });
  });
});

describe('drawImageCover', () => {
  it('draws with a cropped source rectangle instead of stretching to target ratio', () => {
    const drawImage = vi.fn();
    const ctx = { drawImage } as unknown as CanvasRenderingContext2D;
    const image = { naturalWidth: 1920, naturalHeight: 1080 } as HTMLImageElement;

    drawImageCover(ctx, image, 390, 520);

    expect(drawImage).toHaveBeenCalledWith(image, 555, 0, 810, 1080, 0, 0, 390, 520);
  });
});
