/**
 * Color/caption presets for the 4-cut photo strip. Kept as plain data so the
 * renderer and the picker UI share one source of truth.
 */
export interface StripTheme {
  id: string;
  label: string;
  /** CSS color or linear-gradient for the strip background (the border area). */
  background: string;
  /** Caption text shown in the footer. */
  caption: string;
  /** Caption text color. */
  captionColor: string;
}

export const STRIP_THEMES: StripTheme[] = [
  {
    id: 'classic-white',
    label: 'Classic',
    background: '#ffffff',
    caption: 'AirDeck',
    captionColor: '#111827',
  },
  {
    id: 'film-black',
    label: 'Film',
    background: '#0b0b0d',
    caption: '● AirDeck film',
    captionColor: '#f5f5f4',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    background: 'linear-gradient(135deg,#ff7e5f,#feb47b)',
    caption: 'good vibes',
    captionColor: '#ffffff',
  },
  {
    id: 'mint',
    label: 'Mint',
    background: 'linear-gradient(135deg,#5eead4,#a78bfa)',
    caption: 'AirDeck',
    captionColor: '#0b0d12',
  },
  {
    id: 'blush',
    label: 'Blush',
    background: 'linear-gradient(135deg,#ffd1dc,#fbc2eb)',
    caption: 'cute moments',
    captionColor: '#7a1f3d',
  },
];

export function getStripThemeById(id: string): StripTheme {
  return STRIP_THEMES.find((t) => t.id === id) ?? STRIP_THEMES[0]!;
}
