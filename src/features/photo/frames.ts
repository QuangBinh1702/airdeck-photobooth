/**
 * Decorative photo frames. A frame describes a border + background + caption
 * styling that a captured photo is composited into. Kept as plain data so the
 * renderer (canvas) and the UI (preview) share one source of truth.
 */
export interface FrameSpec {
  id: string;
  label: string;
  /** CSS color or gradient for the frame background/border area. */
  background: string;
  /** Solid accent used for the inner border line. */
  accent: string;
  /** Border thickness as a fraction of the shorter photo edge (0..0.2). */
  borderRatio: number;
  /** Extra footer height as a fraction of photo height, for a caption. */
  footerRatio: number;
  /** Default caption text shown in the footer. */
  caption: string;
  /** Caption text color. */
  captionColor: string;
}

export const FRAMES: FrameSpec[] = [
  {
    id: 'none',
    label: 'No frame',
    background: 'transparent',
    accent: 'transparent',
    borderRatio: 0,
    footerRatio: 0,
    caption: '',
    captionColor: '#ffffff',
  },
  {
    id: 'classic-white',
    label: 'Classic',
    background: '#ffffff',
    accent: '#e5e7eb',
    borderRatio: 0.05,
    footerRatio: 0.16,
    caption: 'AirDeck',
    captionColor: '#111827',
  },
  {
    id: 'film-black',
    label: 'Film',
    background: '#0b0b0d',
    accent: '#2a2a2e',
    borderRatio: 0.06,
    footerRatio: 0.18,
    caption: '● AirDeck film',
    captionColor: '#f5f5f4',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    background: 'linear-gradient(135deg,#ff7e5f,#feb47b)',
    accent: '#ffffff',
    borderRatio: 0.06,
    footerRatio: 0.16,
    caption: 'good vibes',
    captionColor: '#ffffff',
  },
  {
    id: 'mint',
    label: 'Mint',
    background: 'linear-gradient(135deg,#5eead4,#a78bfa)',
    accent: '#ffffff',
    borderRatio: 0.06,
    footerRatio: 0.16,
    caption: 'AirDeck',
    captionColor: '#0b0d12',
  },
];

export function getFrameById(id: string): FrameSpec {
  return FRAMES.find((f) => f.id === id) ?? FRAMES[0]!;
}

export interface FrameMetrics {
  /** Final composed canvas size including border + footer. */
  outerWidth: number;
  outerHeight: number;
  /** Rectangle the photo is drawn into. */
  photo: { x: number; y: number; width: number; height: number };
  border: number;
  footer: number;
}

/**
 * Compute the outer canvas size and the inner photo rect for a frame, given
 * the source photo dimensions. Pure geometry — the renderer uses these rects.
 */
export function computeFrameMetrics(
  frame: FrameSpec,
  photoWidth: number,
  photoHeight: number,
): FrameMetrics {
  if (photoWidth <= 0 || photoHeight <= 0) {
    throw new RangeError('computeFrameMetrics: photo dimensions must be > 0');
  }
  const shorter = Math.min(photoWidth, photoHeight);
  const border = Math.round(shorter * frame.borderRatio);
  const footer = Math.round(photoHeight * frame.footerRatio);
  return {
    outerWidth: photoWidth + border * 2,
    outerHeight: photoHeight + border * 2 + footer,
    photo: { x: border, y: border, width: photoWidth, height: photoHeight },
    border,
    footer,
  };
}
