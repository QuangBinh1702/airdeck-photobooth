import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shape-overlay evidence. The fake camera cannot present a real hand, so we
 * inject synthetic hand landmarks through the `window.__airdeckInjectHands`
 * dev hook the app exposes. This proves the gesture-driven shape overlay
 * (triangle / star / circle / quad) actually renders — the signature visual of
 * the reference photobooth — and is captured to output/ as evidence.
 */

const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'output',
);
const shot = (name: string) => path.join(OUTPUT_DIR, `${name}.png`);

async function startCamera(page: Page): Promise<void> {
  await page.getByTestId('start-camera').click();
  await expect(page.getByTestId('hud-camera')).toHaveText(/ready/i, {
    timeout: 15_000,
  });
}

/**
 * Install the hand-injection hook in the browser. We build 21-landmark hands
 * directly with the finger patterns the shape classifier expects:
 *  - triangle: thumb+index+middle extended
 *  - star:     thumb+pinky extended
 *  - circle:   all five extended
 *  - quad:     two open hands
 */
async function injectShape(
  page: Page,
  shape: 'triangle' | 'star' | 'circle' | 'quad' | 'fist',
): Promise<void> {
  await page.evaluate((kind) => {
    type P = { x: number; y: number; z: number };
    const straight = (
      mcpX: number,
      baseY: number,
    ): [P, P, P, P] => [
      { x: mcpX, y: baseY, z: 0 },
      { x: mcpX, y: baseY - 0.08, z: 0 },
      { x: mcpX, y: baseY - 0.16, z: 0 },
      { x: mcpX, y: baseY - 0.24, z: 0 },
    ];
    const curled = (mcpX: number, baseY: number): [P, P, P, P] => [
      { x: mcpX, y: baseY, z: 0 },
      { x: mcpX, y: baseY - 0.06, z: 0 },
      { x: mcpX, y: baseY - 0.02, z: 0 },
      { x: mcpX, y: baseY + 0.02, z: 0 },
    ];
    const thumb = (extended: boolean): [P, P, P, P] =>
      extended
        ? [
            { x: 0.42, y: 0.82, z: 0 },
            { x: 0.36, y: 0.78, z: 0 },
            { x: 0.31, y: 0.74, z: 0 },
            { x: 0.26, y: 0.7, z: 0 },
          ]
        : [
            { x: 0.42, y: 0.82, z: 0 },
            { x: 0.4, y: 0.8, z: 0 },
            { x: 0.34, y: 0.76, z: 0 },
            { x: 0.4, y: 0.74, z: 0 },
          ];

    const build = (pattern: {
      thumb: boolean;
      index: boolean;
      middle: boolean;
      ring: boolean;
      pinky: boolean;
      offsetX?: number;
    }) => {
      const ox = pattern.offsetX ?? 0;
      const wrist: P = { x: 0.5 + ox, y: 0.9, z: 0 };
      const [tc, tm, ti, tt] = thumb(pattern.thumb);
      const idx = pattern.index
        ? straight(0.44 + ox, 0.7)
        : curled(0.44 + ox, 0.7);
      const mid = pattern.middle
        ? straight(0.5 + ox, 0.7)
        : curled(0.5 + ox, 0.7);
      const ring = pattern.ring
        ? straight(0.56 + ox, 0.7)
        : curled(0.56 + ox, 0.7);
      const pky = pattern.pinky
        ? straight(0.62 + ox, 0.7)
        : curled(0.62 + ox, 0.7);
      return [
        wrist,
        { x: tc.x + ox, y: tc.y, z: 0 },
        { x: tm.x + ox, y: tm.y, z: 0 },
        { x: ti.x + ox, y: ti.y, z: 0 },
        { x: tt.x + ox, y: tt.y, z: 0 },
        ...idx,
        ...mid,
        ...ring,
        ...pky,
      ];
    };

    let hands: P[][];
    if (kind === 'triangle') {
      hands = [
        build({ thumb: true, index: true, middle: true, ring: false, pinky: false }),
      ];
    } else if (kind === 'star') {
      hands = [
        build({ thumb: true, index: false, middle: false, ring: false, pinky: true }),
      ];
    } else if (kind === 'circle') {
      hands = [
        build({ thumb: true, index: true, middle: true, ring: true, pinky: true }),
      ];
    } else if (kind === 'fist') {
      // A hand that forms no recognized shape (all curled) — simulates the
      // user lowering/relaxing the hand between shots.
      hands = [
        build({ thumb: false, index: false, middle: false, ring: false, pinky: false }),
      ];
    } else {
      hands = [
        build({ thumb: true, index: true, middle: true, ring: true, pinky: true, offsetX: -0.18 }),
        build({ thumb: true, index: true, middle: true, ring: true, pinky: true, offsetX: 0.18 }),
      ];
    }
    (window as unknown as { __airdeckInjectHands?: () => P[][] }).__airdeckInjectHands =
      () => hands;
  }, shape);
}

test.describe('Gesture shape overlay — evidence', () => {
  test('SHAPE-01 triangle overlay renders', async ({ page }) => {
    await page.goto('/');
    await startCamera(page);
    await injectShape(page, 'triangle');
    await expect(page.getByText('🔺 Tam giác')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: shot('SHAPE-01-triangle'), fullPage: true });
  });

  test('SHAPE-02 star overlay renders', async ({ page }) => {
    await page.goto('/');
    await startCamera(page);
    await injectShape(page, 'star');
    await expect(page.getByText('⭐ Ngôi sao')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: shot('SHAPE-02-star'), fullPage: true });
  });

  test('SHAPE-03 circle overlay renders', async ({ page }) => {
    await page.goto('/');
    await startCamera(page);
    await injectShape(page, 'circle');
    await expect(page.getByText('⭕ Vòng tròn')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: shot('SHAPE-03-circle'), fullPage: true });
  });

  test('SHAPE-04 two-hand quad frame renders', async ({ page }) => {
    await page.goto('/');
    await startCamera(page);
    await injectShape(page, 'quad');
    await expect(page.getByText('🔲 Khung 3D')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: shot('SHAPE-04-quad'), fullPage: true });
  });

  test('SHAPE-05 shape capture produces a frame-window composite', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('timer-0').click();
    await startCamera(page);
    await injectShape(page, 'circle');
    await expect(page.getByText('⭕ Vòng tròn')).toBeVisible({ timeout: 5000 });
    // Manual shutter while a shape is held -> two-shot frame-window flow.
    await page.getByTestId('capture-btn').click();
    // The flow shows a "hold the frame" phase hint between the two shots.
    await expect(page.getByTestId('phase-hint')).toBeVisible({ timeout: 4000 });
    // ...and a LIVE preview: frozen shot 1 as background + live camera in shape.
    await expect(page.getByTestId('frame-window-preview')).toBeVisible({
      timeout: 4000,
    });
    await page.screenshot({ path: shot('SHAPE-05-frame-window'), fullPage: true });
    // Exactly one composite photo is produced.
    await expect(page.getByTestId('gallery-item')).toHaveCount(1, {
      timeout: 6000,
    });
  });

  test('SHAPE-06 gesture mode suppresses shapes (no conflict)', async ({
    page,
  }) => {
    await page.goto('/');
    await startCamera(page);
    // Switch to gesture-capture mode.
    await page.getByTestId('mode-gesture').click();
    // Inject an open-palm hand: in shape mode this would draw a circle, but in
    // gesture mode the shape must NOT appear (the two styles never overlap).
    await injectShape(page, 'circle');
    await page.waitForTimeout(800);
    await expect(page.getByText('⭕ Vòng tròn')).toHaveCount(0);
    await page.screenshot({ path: shot('SHAPE-06-gesture-no-shape'), fullPage: true });
  });

  test('SHAPE-07 holding a shape auto-starts countdown then captures', async ({
    page,
  }) => {
    await page.goto('/');
    // Shape mode (default) + a short timer so the countdown is observable.
    await page.getByTestId('timer-3').click();
    await startCamera(page);
    await injectShape(page, 'triangle');
    // Holding the shape steadily should trigger the countdown automatically.
    await expect(page.getByTestId('countdown')).toBeVisible({ timeout: 4000 });
    await page.screenshot({ path: shot('SHAPE-07-shape-countdown'), fullPage: true });
    // ...and the two-shot frame-window flow eventually saves a composite.
    await expect(page.getByTestId('gallery-item').first()).toBeVisible({
      timeout: 12000,
    });
  });

  test('SHAPE-08 holding a shape does NOT machine-gun captures', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('timer-0').click(); // instant, to stress repeats
    await startCamera(page);
    await injectShape(page, 'triangle');
    // The two-shot flow yields exactly ONE composite; holding the shape must
    // not produce more until the hand is lowered.
    await expect(page.getByTestId('gallery-item')).toHaveCount(1, {
      timeout: 6000,
    });
    await page.waitForTimeout(3000); // covers the 2s cooldown window
    await expect(page.getByTestId('gallery-item')).toHaveCount(1);
    await page.screenshot({ path: shot('SHAPE-08-no-machinegun'), fullPage: true });
  });

  test('SHAPE-09 lowering then re-forming a shape allows a second shot', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('timer-0').click();
    await startCamera(page);
    await injectShape(page, 'triangle');
    await expect(page.getByTestId('gallery-item')).toHaveCount(1, {
      timeout: 6000,
    });
    // Lower the hand (no hands) to re-arm, waiting past the cooldown.
    await page.evaluate(() => {
      (
        window as unknown as { __airdeckInjectHands?: () => unknown }
      ).__airdeckInjectHands = () => [];
    });
    await page.waitForTimeout(2500);
    // Re-form the shape -> a second composite is allowed.
    await injectShape(page, 'triangle');
    await expect(page.getByTestId('gallery-item')).toHaveCount(2, {
      timeout: 12000,
    });
    await page.screenshot({ path: shot('SHAPE-09-rearm'), fullPage: true });
  });
});
