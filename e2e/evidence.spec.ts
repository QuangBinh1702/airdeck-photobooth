import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Evidence-capture suite for the Approved test-case document
 * `docs/test_cases/2026-05-30-000002-airdeck-photobooth-test-case.md`.
 *
 * Each test maps to one TC-### and writes a screenshot to `output/` so the
 * execution report can embed it as visual proof. This is the project-runner
 * equivalent of the Playwright-MCP screenshot step required by
 * `th-execute-automation-tests` (MCP is not available in this workspace).
 *
 * Camera uses Chromium's fake media stream (configured in playwright.config.ts).
 */

const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'output',
);

function shot(name: string): string {
  return path.join(OUTPUT_DIR, `${name}.png`);
}

async function setTimerInstant(page: Page): Promise<void> {
  await page.getByTestId('timer-0').click();
}

async function startCameraReady(page: Page): Promise<void> {
  await page.getByTestId('start-camera').click();
  await expect(page.getByTestId('hud-camera')).toHaveText(/ready/i, {
    timeout: 15_000,
  });
  await page.waitForFunction(() => {
    const v = document.querySelector<HTMLVideoElement>(
      '[data-testid="camera-video"]',
    );
    return !!v && v.videoWidth > 0;
  });
}

async function captureOne(page: Page): Promise<void> {
  await setTimerInstant(page);
  await startCameraReady(page);
  await page.getByTestId('capture-btn').click();
  await expect(page.getByTestId('gallery-item').first()).toBeVisible();
}

test.describe('AirDeck Photobooth — evidence', () => {
  test('TC-001 shell renders core elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /AirDeck/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Photo Studio' }),
    ).toBeVisible();
    await expect(page.getByText(/không rời khỏi trình duyệt/i)).toBeVisible();
    await page.screenshot({ path: shot('TC-001-shell'), fullPage: true });
  });

  test('TC-002 mode switch updates cheatsheet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Slides' }).click();
    await expect(page.getByRole('button', { name: 'Slides' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText(/Cử chỉ · slides/i)).toBeVisible();
    await page.screenshot({ path: shot('TC-002-mode-slides'), fullPage: true });
  });

  test('TC-003 enable camera reaches ready', async ({ page }) => {
    await page.goto('/');
    await startCameraReady(page);
    await expect(page.getByTestId('camera-video')).toBeVisible();
    await page.screenshot({ path: shot('TC-003-camera-ready'), fullPage: true });
  });

  test('TC-004 manual capture adds photo to gallery', async ({ page }) => {
    await page.goto('/');
    await captureOne(page);
    await expect(page.getByTestId('gallery-item')).toHaveCount(1);
    await page.screenshot({ path: shot('TC-004-capture'), fullPage: true });
  });

  test('TC-005 filter applies to live preview', async ({ page }) => {
    await page.goto('/');
    await startCameraReady(page);
    await page.getByRole('button', { name: 'B&W' }).click();
    const filterValue = await page
      .getByTestId('camera-video')
      .evaluate((el) => (el as HTMLElement).style.filter);
    expect(filterValue).toContain('grayscale');
    await page.screenshot({ path: shot('TC-005-filter-bw'), fullPage: true });
  });

  test('TC-006 timer selection marks active', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('timer-5').click();
    await expect(page.getByTestId('timer-5')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.screenshot({ path: shot('TC-006-timer-5s'), fullPage: true });
  });

  test('TC-007 frame selection marks active', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('frame-mint').click();
    await expect(page.getByTestId('frame-mint')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.screenshot({ path: shot('TC-007-frame-mint'), fullPage: true });
  });

  test('TC-008 select photo shows framed preview + enables download', async ({
    page,
  }) => {
    await page.goto('/');
    await captureOne(page);
    await page.getByTestId('frame-sunset').click();
    await page.getByTestId('gallery-item').first().click();
    await expect(page.getByTestId('framed-image')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('download-btn')).toBeEnabled();
    await page.screenshot({ path: shot('TC-008-framed-download'), fullPage: true });
  });

  test('TC-009 delete a photo from the gallery', async ({ page }) => {
    await page.goto('/');
    await captureOne(page);
    await expect(page.getByTestId('gallery-item')).toHaveCount(1);
    await page.getByTestId('gallery-item').first().hover();
    await page.getByTestId('gallery-delete').first().click();
    await expect(page.getByTestId('gallery-item')).toHaveCount(0);
    await page.screenshot({ path: shot('TC-009-delete'), fullPage: true });
  });

  test('TC-010 clear all photos', async ({ page }) => {
    await page.goto('/');
    await setTimerInstant(page);
    await startCameraReady(page);
    await page.getByTestId('capture-btn').click();
    await page.getByTestId('capture-btn').click();
    await expect(page.getByTestId('gallery-item')).toHaveCount(2);
    await page.getByRole('button', { name: /Xoá tất cả/i }).click();
    await expect(page.getByText(/Chưa có ảnh nào/i)).toBeVisible();
    await page.screenshot({ path: shot('TC-010-clear-all'), fullPage: true });
  });

  test('TC-011 switching capture mode swaps the legend', async ({ page }) => {
    await page.goto('/');
    // Default = shape mode → shape legend visible.
    await expect(page.getByTestId('shape-legend')).toBeVisible();
    await page.getByTestId('mode-gesture').click();
    await expect(page.getByTestId('gesture-legend')).toBeVisible();
    await expect(page.getByTestId('shape-legend')).toHaveCount(0);
    await page.screenshot({ path: shot('TC-011-capture-mode'), fullPage: true });
  });

  test('TC-012 download disabled when no photo selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('download-btn')).toBeDisabled();
    await page.screenshot({
      path: shot('TC-012-download-disabled'),
      fullPage: true,
    });
  });

  test('TC-013 capture disabled before camera ready', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('capture-btn')).toBeDisabled();
    await page.screenshot({
      path: shot('TC-013-capture-disabled'),
      fullPage: true,
    });
  });

  test('TC-014 keyboard Space triggers capture (instant timer)', async ({
    page,
  }) => {
    await page.goto('/');
    await setTimerInstant(page);
    await startCameraReady(page);
    await page.keyboard.press('Space');
    await expect(page.getByTestId('gallery-item').first()).toBeVisible();
    await page.screenshot({ path: shot('TC-014-space-capture'), fullPage: true });
  });

  test('TC-015 countdown overlay appears for a timed capture', async ({
    page,
  }) => {
    await page.goto('/');
    await startCameraReady(page);
    await page.getByTestId('timer-3').click();
    await page.getByTestId('capture-btn').click();
    // The countdown overlay should appear during the 3s window.
    await expect(page.getByTestId('countdown')).toBeVisible({ timeout: 2_000 });
    await page.screenshot({ path: shot('TC-015-countdown'), fullPage: true });
    // And a photo is eventually captured (3s countdown + processing headroom).
    await expect(page.getByTestId('gallery-item').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('TC-017 build a 4-cut photo strip and enable download', async ({
    page,
  }) => {
    await page.goto('/');
    await setTimerInstant(page);
    await startCameraReady(page);
    // Capture 4 photos.
    for (let i = 0; i < 4; i += 1) {
      await page.getByTestId('capture-btn').click();
      await expect(page.getByTestId('gallery-item')).toHaveCount(i + 1);
    }
    // Add all 4 to the strip selection.
    const toggles = page.getByTestId('gallery-strip-toggle');
    await expect(toggles).toHaveCount(4, { timeout: 10_000 });
    for (let i = 0; i < 4; i += 1) {
      await toggles.nth(i).click({ force: true });
    }
    // Pick a theme + layout, then the strip preview should render.
    await page.getByTestId('strip-theme-sunset').click();
    await expect(page.getByTestId('strip-image')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('strip-download')).toBeEnabled();
    await page.screenshot({ path: shot('TC-017-strip'), fullPage: true });
  });

  test('TC-018 strip preview opens a full-size lightbox', async ({ page }) => {
    await page.goto('/');
    await setTimerInstant(page);
    await startCameraReady(page);
    await page.getByTestId('capture-btn').click();
    await expect(page.getByTestId('gallery-item')).toHaveCount(1);
    await page.getByTestId('gallery-strip-toggle').first().click();
    await expect(page.getByTestId('strip-image')).toBeVisible({
      timeout: 10_000,
    });
    // Open the preview lightbox.
    await page.getByTestId('strip-preview-btn').click();
    await expect(page.getByTestId('strip-preview-image')).toBeVisible();
    await page.screenshot({ path: shot('TC-018-strip-preview'), fullPage: true });
    // Close via the close button.
    await page.getByTestId('modal-close').click();
    await expect(page.getByTestId('strip-preview-image')).toHaveCount(0);
  });

  test('TC-019 framed photo opens a full-size lightbox on click', async ({
    page,
  }) => {
    await page.goto('/');
    await setTimerInstant(page);
    await startCameraReady(page);
    await page.getByTestId('capture-btn').click();
    await expect(page.getByTestId('gallery-item')).toHaveCount(1);
    // Selecting the photo renders the framed preview.
    await page.getByTestId('gallery-item').first().click();
    await expect(page.getByTestId('framed-image')).toBeVisible({
      timeout: 10_000,
    });
    // Clicking the framed image opens the zoom lightbox.
    await page.getByTestId('framed-preview-open').click();
    await expect(page.getByTestId('framed-preview-image')).toBeVisible();
    await page.screenshot({ path: shot('TC-019-framed-zoom'), fullPage: true });
    // Close by pressing Escape.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('framed-preview-image')).toHaveCount(0);
  });
});
