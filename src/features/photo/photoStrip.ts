/**
 * Layout math for the Korean-style "4-cut" photo strip.
 *
 * Pure geometry only: given a canvas size, frame configuration, and number of
 * photos, compute the pixel rectangles each photo should be drawn into. The
 * rendering layer consumes these rects to composite captured frames.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type StripLayout = 'vertical-4' | 'grid-2x2';

export interface StripConfig {
  layout: StripLayout;
  /** Outer canvas width in px. */
  width: number;
  /** Outer canvas height in px. */
  height: number;
  /** Uniform outer margin (border) in px. */
  margin: number;
  /** Gap between photo cells in px. */
  gap: number;
  /** Extra space reserved at the bottom for a caption/logo, in px. */
  footer: number;
}

export const DEFAULT_STRIP_CONFIG: StripConfig = {
  layout: 'vertical-4',
  width: 600,
  height: 1800,
  margin: 30,
  gap: 20,
  footer: 90,
};

/** Number of photo cells a layout expects. */
export function cellCount(layout: StripLayout): number {
  switch (layout) {
    case 'vertical-4':
      return 4;
    case 'grid-2x2':
      return 4;
    default:
      return 4;
  }
}

/**
 * Compute the rectangle for each photo cell.
 * Throws if the config produces non-positive cell dimensions.
 */
export function computeCells(config: StripConfig): Rect[] {
  const { layout, width, height, margin, gap, footer } = config;
  const innerW = width - margin * 2;
  const innerH = height - margin * 2 - footer;
  if (innerW <= 0 || innerH <= 0) {
    throw new RangeError('computeCells: inner area is non-positive');
  }

  if (layout === 'grid-2x2') {
    const cols = 2;
    const rows = 2;
    const cellW = (innerW - gap * (cols - 1)) / cols;
    const cellH = (innerH - gap * (rows - 1)) / rows;
    if (cellW <= 0 || cellH <= 0) {
      throw new RangeError('computeCells: cell size is non-positive');
    }
    const rects: Rect[] = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        rects.push({
          x: margin + c * (cellW + gap),
          y: margin + r * (cellH + gap),
          width: cellW,
          height: cellH,
        });
      }
    }
    return rects;
  }

  // vertical-4 (default)
  const rows = 4;
  const cellW = innerW;
  const cellH = (innerH - gap * (rows - 1)) / rows;
  if (cellH <= 0) {
    throw new RangeError('computeCells: cell height is non-positive');
  }
  const rects: Rect[] = [];
  for (let r = 0; r < rows; r += 1) {
    rects.push({
      x: margin,
      y: margin + r * (cellH + gap),
      width: cellW,
      height: cellH,
    });
  }
  return rects;
}

/**
 * Compute source crop rect to draw a source image into a destination cell
 * using object-fit: cover semantics (fill the cell, preserve aspect, center).
 */
export function coverCrop(
  srcWidth: number,
  srcHeight: number,
  dst: Rect,
): Rect {
  if (srcWidth <= 0 || srcHeight <= 0) {
    throw new RangeError('coverCrop: source dimensions must be positive');
  }
  const srcRatio = srcWidth / srcHeight;
  const dstRatio = dst.width / dst.height;

  let cropW = srcWidth;
  let cropH = srcHeight;

  if (srcRatio > dstRatio) {
    // Source is wider: crop the sides.
    cropW = srcHeight * dstRatio;
  } else {
    // Source is taller: crop top/bottom.
    cropH = srcWidth / dstRatio;
  }

  return {
    x: (srcWidth - cropW) / 2,
    y: (srcHeight - cropH) / 2,
    width: cropW,
    height: cropH,
  };
}
