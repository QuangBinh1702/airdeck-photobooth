import { describe, expect, it } from 'vitest';
import { buildFilename, dataUrlToBlob } from '@/features/photo/share';

describe('dataUrlToBlob', () => {
  it('decodes a base64 PNG data URL into a Blob of the right type', () => {
    // "AirDeck" base64 -> just need a valid base64 payload.
    const dataUrl = `data:image/png;base64,${btoa('AirDeck')}`;
    const blob = dataUrlToBlob(dataUrl);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe('AirDeck'.length);
  });

  it('throws on a non-base64 data URL', () => {
    expect(() => dataUrlToBlob('not-a-data-url')).toThrow();
  });
});

describe('buildFilename', () => {
  it('builds a zero-padded timestamped name', () => {
    const date = new Date(2026, 4, 30, 9, 5, 2); // 2026-05-30 09:05:02
    expect(buildFilename('airdeck', 'png', date)).toBe(
      'airdeck-20260530-090502.png',
    );
  });

  it('respects a custom prefix and extension', () => {
    const date = new Date(2026, 11, 1, 23, 59, 59);
    expect(buildFilename('strip', 'jpg', date)).toBe(
      'strip-20261201-235959.jpg',
    );
  });
});
