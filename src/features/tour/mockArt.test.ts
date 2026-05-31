import { describe, expect, it } from 'vitest';
import {
  mockAccessory,
  mockFramed,
  mockPhoto,
  mockStrip,
} from '@/features/tour/mockArt';

describe('mock art', () => {
  it('produces SVG data URLs', () => {
    for (const url of [mockPhoto(), mockFramed(), mockStrip(), mockAccessory()]) {
      expect(url.startsWith('data:image/svg+xml')).toBe(true);
      expect(url.length).toBeGreaterThan(50);
    }
  });

  it('embeds a custom caption in the framed mock', () => {
    const url = mockFramed('Hello');
    expect(decodeURIComponent(url)).toContain('Hello');
  });

  it('strip mock contains four portrait cells', () => {
    const decoded = decodeURIComponent(mockStrip());
    // Each cell embeds an inner <svg>; expect at least 4.
    const inner = decoded.match(/<svg/g) ?? [];
    expect(inner.length).toBeGreaterThanOrEqual(5); // outer + 4 cells
  });
});
