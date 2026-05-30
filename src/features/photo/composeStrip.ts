import {
  computeCells,
  coverCrop,
  cellCount,
  type StripConfig,
  type StripLayout,
  DEFAULT_STRIP_CONFIG,
} from './photoStrip';
import { paintBackground } from './composeFrame';
import { getStripThemeById, type StripTheme } from './stripThemes';

export interface StripRenderOptions {
  layout?: StripLayout;
  themeId?: string;
  caption?: string;
  type?: string;
  quality?: number;
}

/** Default strip dimensions per layout (px). */
function configFor(layout: StripLayout): StripConfig {
  if (layout === 'grid-2x2') {
    return { ...DEFAULT_STRIP_CONFIG, layout, width: 1000, height: 1000, footer: 70 };
  }
  return { ...DEFAULT_STRIP_CONFIG, layout };
}

/**
 * Compose up to `cellCount(layout)` images into a photo strip and return a data
 * URL. Extra images are ignored; missing cells are left as the theme
 * background. Returns null when the 2D context is unavailable or no images.
 */
export function composeStrip(
  images: HTMLImageElement[],
  canvas: HTMLCanvasElement,
  options: StripRenderOptions = {},
): string | null {
  if (images.length === 0) return null;

  const layout = options.layout ?? 'vertical-4';
  const config = configFor(layout);
  const theme: StripTheme = getStripThemeById(
    options.themeId ?? 'classic-white',
  );

  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background (border area + footer).
  paintBackground(ctx, theme.background, canvas.width, canvas.height);

  const cells = computeCells(config);
  const n = Math.min(images.length, cellCount(layout));

  for (let i = 0; i < n; i += 1) {
    const img = images[i]!;
    const cell = cells[i]!;
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    if (!sw || !sh) continue;

    const crop = coverCrop(sw, sh, cell);
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      cell.x,
      cell.y,
      cell.width,
      cell.height,
    );
    // Subtle inner border for definition against the background.
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
  }

  // Footer caption.
  const caption = options.caption ?? theme.caption;
  if (caption) {
    ctx.fillStyle = theme.captionColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.round(config.footer * 0.34);
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(
      caption,
      canvas.width / 2,
      canvas.height - config.margin - config.footer / 2,
    );
  }

  return canvas.toDataURL(options.type ?? 'image/png', options.quality);
}
