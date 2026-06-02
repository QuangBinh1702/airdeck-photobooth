export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

function sourceWidth(source: CanvasImageSource): number {
  if ('videoWidth' in source && source.videoWidth) return source.videoWidth;
  if ('naturalWidth' in source && source.naturalWidth) return source.naturalWidth;
  if ('width' in source && typeof source.width === 'number') return source.width;
  return 0;
}

function sourceHeight(source: CanvasImageSource): number {
  if ('videoHeight' in source && source.videoHeight) return source.videoHeight;
  if ('naturalHeight' in source && source.naturalHeight) return source.naturalHeight;
  if ('height' in source && typeof source.height === 'number') return source.height;
  return 0;
}

/**
 * Return the source crop needed to draw an image/video into a target rectangle
 * with CSS object-fit: cover semantics, preserving aspect ratio.
 */
export function coverSourceRect(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
): SourceRect {
  if (!srcW || !srcH || !targetW || !targetH) {
    return { sx: 0, sy: 0, sw: 0, sh: 0 };
  }

  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;

  if (srcRatio > targetRatio) {
    const sw = srcH * targetRatio;
    return {
      sx: Math.round((srcW - sw) / 2),
      sy: 0,
      sw: Math.round(sw),
      sh: srcH,
    };
  }

  const sh = srcW / targetRatio;
  return {
    sx: 0,
    sy: Math.round((srcH - sh) / 2),
    sw: srcW,
    sh: Math.round(sh),
  };
}

/** Draw an image/video into a target canvas area without aspect-ratio distortion. */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  targetW: number,
  targetH: number,
): void {
  const srcW = sourceWidth(source);
  const srcH = sourceHeight(source);
  const rect = coverSourceRect(srcW, srcH, targetW, targetH);
  if (!rect.sw || !rect.sh) return;
  ctx.drawImage(source, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, targetW, targetH);
}
