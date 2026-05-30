import { describe, expect, it } from 'vitest';
import { FILTERS, getFilterById } from '@/features/photo/filters';

describe('filters', () => {
  it('exposes a stable set with unique ids', () => {
    const ids = FILTERS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('none');
    expect(ids).toContain('film');
  });

  it('resolves a filter by id', () => {
    expect(getFilterById('mono').label).toBe('B&W');
  });

  it('falls back to the first (none) filter for unknown ids', () => {
    expect(getFilterById('does-not-exist').id).toBe('none');
  });

  it('film/vintage filters carry a grain value for the retro look', () => {
    expect(getFilterById('film').grain).toBeGreaterThan(0);
    expect(getFilterById('vintage').grain).toBeGreaterThan(0);
  });
});
