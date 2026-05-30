import { describe, expect, it } from 'vitest';
import { STRIP_THEMES, getStripThemeById } from '@/features/photo/stripThemes';

describe('strip themes', () => {
  it('has unique ids', () => {
    const ids = STRIP_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves a theme by id', () => {
    expect(getStripThemeById('mint').label).toBe('Mint');
  });

  it('falls back to the first theme for unknown ids', () => {
    expect(getStripThemeById('nope').id).toBe(STRIP_THEMES[0]!.id);
  });
});
