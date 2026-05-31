import { describe, expect, it, vi } from 'vitest';
import { drawAccessories } from '@/features/photo/drawAccessories';
import type { AccessoryPlacement } from '@/features/photo/accessories';

interface Rec {
  translates: [number, number][];
  rotations: number[];
  scales: [number, number][];
  saves: number;
  restores: number;
}

function makeCtx(rec: Rec): CanvasRenderingContext2D {
  // A permissive stub: every drawing method is a no-op, but we record the
  // transform calls so we can assert anchor/scale/rotation behavior.
  const noop = () => {};
  return new Proxy(
    {
      save: () => {
        rec.saves += 1;
      },
      restore: () => {
        rec.restores += 1;
      },
      translate: (x: number, y: number) => rec.translates.push([x, y]),
      rotate: (r: number) => rec.rotations.push(r),
      scale: (x: number, y: number) => rec.scales.push([x, y]),
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
    } as unknown as CanvasRenderingContext2D,
    {
      get(target, prop) {
        const v = (target as unknown as Record<string | symbol, unknown>)[prop];
        if (v !== undefined) return v;
        // Any other property: return a no-op fn (beginPath, fill, arc, ...) or
        // a writable stub for style props.
        return typeof prop === 'string' ? noop : undefined;
      },
      set() {
        return true;
      },
    },
  );
}

function newRec(): Rec {
  return { translates: [], rotations: [], scales: [], saves: 0, restores: 0 };
}

const placement = (over: Partial<AccessoryPlacement> = {}): AccessoryPlacement => ({
  id: 'glasses',
  x: 0.5,
  y: 0.4,
  unit: 0.2,
  rotation: 0,
  ...over,
});

describe('drawAccessories', () => {
  it('sets up an anchor/scale transform per placement and balances save/restore', () => {
    const rec = newRec();
    drawAccessories(makeCtx(rec), [placement()], {
      width: 200,
      height: 100,
      mirror: false,
    });
    // First translate is the anchor: (0.5*200, 0.4*100).
    expect(rec.translates[0]).toEqual([100, 40]);
    // Scale uses unit*width on both axes.
    expect(rec.scales[0]).toEqual([0.2 * 200, 0.2 * 200]);
    expect(rec.saves).toBe(1);
    expect(rec.restores).toBe(1);
  });

  it('flips X and inverts rotation when mirrored', () => {
    const rec = newRec();
    drawAccessories(makeCtx(rec), [placement({ x: 0.25, rotation: 0.3 })], {
      width: 200,
      height: 100,
      mirror: true,
    });
    expect(rec.translates[0]![0]).toBeCloseTo((1 - 0.25) * 200, 5);
    expect(rec.rotations[0]).toBeCloseTo(-0.3, 5);
  });

  it('skips unknown accessory ids', () => {
    const rec = newRec();
    drawAccessories(makeCtx(rec), [placement({ id: 'does-not-exist' })], {
      width: 100,
      height: 100,
    });
    expect(rec.saves).toBe(0);
  });

  it('skips non-positive unit sizes', () => {
    const rec = newRec();
    drawAccessories(makeCtx(rec), [placement({ unit: 0 })], {
      width: 100,
      height: 100,
    });
    expect(rec.saves).toBe(0);
  });

  it('does nothing for an empty list', () => {
    const rec = newRec();
    drawAccessories(makeCtx(rec), [], { width: 10, height: 10 });
    expect(rec.translates).toHaveLength(0);
  });

  it('renders every catalog accessory without throwing', () => {
    const rec = newRec();
    const ids = ['glasses', 'sunglasses', 'tophat', 'crown', 'bunny', 'cat', 'mustache', 'clown'];
    expect(() =>
      drawAccessories(
        makeCtx(rec),
        ids.map((id) => placement({ id })),
        { width: 300, height: 300, mirror: true },
      ),
    ).not.toThrow();
    // Each placement does at least one save/restore; some art saves internally
    // too. The key invariant is that saves and restores stay balanced.
    expect(rec.saves).toBeGreaterThanOrEqual(ids.length);
    expect(rec.restores).toBe(rec.saves);
  });
});

// Keep vi import used (silences no-unused in strict setups).
void vi;
