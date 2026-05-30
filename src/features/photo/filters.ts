/**
 * Photo filters expressed as CSS/Canvas `filter` strings so they can be applied
 * both to the live preview (CSS) and to the captured canvas (ctx.filter).
 * Trend-driven set: clean, vintage/film, warm, cool, mono. (See PLAN.md.)
 */
export interface PhotoFilter {
  id: string;
  label: string;
  /** Value for CSS `filter` / CanvasRenderingContext2D.filter. */
  css: string;
  /** Optional film-grain overlay opacity in [0,1] for the retro look. */
  grain?: number;
}

export const FILTERS: PhotoFilter[] = [
  { id: 'none', label: 'Original', css: 'none' },
  { id: 'mono', label: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  {
    id: 'film',
    label: 'Film',
    css: 'sepia(0.35) contrast(1.1) saturate(1.1) brightness(1.02)',
    grain: 0.12,
  },
  {
    id: 'warm',
    label: 'Warm',
    css: 'sepia(0.2) saturate(1.3) brightness(1.05) hue-rotate(-10deg)',
  },
  {
    id: 'cool',
    label: 'Cool',
    css: 'saturate(1.1) brightness(1.02) hue-rotate(12deg)',
  },
  {
    id: 'vintage',
    label: 'Vintage',
    css: 'sepia(0.5) contrast(0.95) saturate(0.85) brightness(1.05)',
    grain: 0.18,
  },
];

export function getFilterById(id: string): PhotoFilter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0]!;
}
