import { describe, expect, it, beforeEach } from 'vitest';
import { loadJSON, mergeStored, saveJSON } from '@/lib/persist';

describe('saveJSON / loadJSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a value through localStorage', () => {
    saveJSON('k', { a: 1, b: 'x' });
    expect(loadJSON('k', null)).toEqual({ a: 1, b: 'x' });
  });

  it('returns the fallback for a missing key', () => {
    expect(loadJSON('missing', 'fallback')).toBe('fallback');
  });

  it('returns the fallback for corrupt JSON', () => {
    localStorage.setItem('airdeck:bad', '{not json');
    expect(loadJSON('bad', 42)).toBe(42);
  });
});

describe('mergeStored', () => {
  const defaults = { a: 1, b: 'x', c: true };

  it('returns defaults (copy) when stored is null', () => {
    const out = mergeStored(defaults, null);
    expect(out).toEqual(defaults);
    expect(out).not.toBe(defaults);
  });

  it('overrides only provided keys', () => {
    expect(mergeStored(defaults, { b: 'y' })).toEqual({ a: 1, b: 'y', c: true });
  });

  it('ignores unknown keys not in defaults', () => {
    const out = mergeStored(defaults, { z: 99 } as unknown as Partial<typeof defaults>);
    expect(out).toEqual(defaults);
    expect('z' in out).toBe(false);
  });

  it('ignores undefined values', () => {
    expect(mergeStored(defaults, { a: undefined })).toEqual(defaults);
  });
});
