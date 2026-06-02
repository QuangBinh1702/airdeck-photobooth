import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildFilename,
  canvasToBlob,
  dataUrlToBlob,
  downloadBlob,
  saveBlob,
  shareBlob,
} from '@/features/photo/share';

function makeBlob(type = 'image/jpeg'): Blob {
  return new Blob(['fake-image'], { type });
}

function makeCanvas(blob: Blob | null): HTMLCanvasElement {
  return {
    toBlob: vi.fn((cb: BlobCallback, type?: string) => {
      cb(blob ? new Blob([blob], { type: type ?? blob.type }) : null);
    }),
  } as unknown as HTMLCanvasElement;
}

describe('dataUrlToBlob', () => {
  it('decodes a base64 PNG data URL into a Blob of the right type', () => {
    const dataUrl = `data:image/png;base64,${btoa('AirDeck')}`;
    const blob = dataUrlToBlob(dataUrl);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe('AirDeck'.length);
  });

  it('throws on a non-base64 data URL', () => {
    expect(() => dataUrlToBlob('not-a-data-url')).toThrow();
  });
});

describe('mobile-safe photo save helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:airdeck-test'),
      revokeObjectURL: vi.fn(),
    });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('builds a zero-padded timestamped name', () => {
    const date = new Date(2026, 4, 30, 9, 5, 2);
    expect(buildFilename('airdeck', 'png', date)).toBe(
      'airdeck-20260530-090502.png',
    );
  });

  it('builds jpg filenames when requested', () => {
    const name = buildFilename('airdeck', 'jpg', new Date(2026, 5, 1, 2, 3, 4));
    expect(name).toBe('airdeck-20260601-020304.jpg');
  });

  it('exports a canvas to a jpeg Blob', async () => {
    const canvas = makeCanvas(makeBlob('image/png'));
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    expect(blob.type).toBe('image/jpeg');
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.92);
  });

  it('rejects when canvas export fails', async () => {
    await expect(canvasToBlob(makeCanvas(null))).rejects.toThrow('Could not export canvas');
  });

  it('downloads a Blob through an object URL and revokes it later', () => {
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        Object.defineProperty(el, 'click', { configurable: true, value: click });
      }
      return el;
    });

    downloadBlob(makeBlob(), 'airdeck-test.jpg');

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:airdeck-test');
  });

  it('shares a Blob as a File when Web Share supports files', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, share, canShare });

    await expect(shareBlob(makeBlob(), 'airdeck-test.jpg')).resolves.toBe('shared');

    expect(canShare).toHaveBeenCalledWith({ files: [expect.any(File)] });
    expect(share).toHaveBeenCalledWith({
      files: [expect.any(File)],
      title: 'AirDeck photo',
    });
  });

  it('does not download when the user cancels the native share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, share, canShare });
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        Object.defineProperty(el, 'click', { configurable: true, value: click });
      }
      return el;
    });

    await expect(saveBlob(makeBlob(), 'airdeck-test.jpg')).resolves.toBe('cancelled');

    expect(click).not.toHaveBeenCalled();
  });

  it('falls back to download when sharing is unsupported', async () => {
    vi.stubGlobal('navigator', { ...navigator, share: undefined });
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        Object.defineProperty(el, 'click', { configurable: true, value: click });
      }
      return el;
    });

    await saveBlob(makeBlob(), 'airdeck-test.jpg');

    expect(click).toHaveBeenCalledTimes(1);
  });
});
