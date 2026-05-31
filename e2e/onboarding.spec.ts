import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'output',
);
const shot = (name: string) => path.join(OUTPUT_DIR, `${name}.png`);

/**
 * First-run onboarding. These tests intentionally do NOT pre-seed
 * localStorage, so the app behaves as it would for a brand-new visitor:
 * the guided tour auto-starts once and is then remembered.
 */
test.describe('Onboarding (first run)', () => {
  test('TC-022 auto-starts the guided tour on first visit and remembers it', async ({
    page,
  }) => {
    await page.goto('/');
    // The tour auto-launches for a new visitor (after a short defer).
    await expect(page.getByTestId('tour-tooltip')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId('tour-image')).toBeVisible();
    await page.screenshot({ path: shot('TC-022-onboarding'), fullPage: true });

    // Close the tour.
    await page.getByTestId('tour-skip').click();
    await expect(page.getByTestId('tour-tooltip')).toHaveCount(0);

    // It is remembered: a reload does NOT auto-start the tour again.
    await page.reload();
    await page.waitForTimeout(1200);
    await expect(page.getByTestId('tour-tooltip')).toHaveCount(0);
  });

  test('TC-023 sound preference persists across reloads', async ({ page }) => {
    await page.goto('/');
    // Dismiss the auto tour if it appears.
    const skip = page.getByTestId('tour-skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();

    const sound = page.getByTestId('sound-toggle');
    await expect(sound).toHaveAttribute('aria-pressed', 'true');
    await sound.click();
    await expect(sound).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

/**
 * Returning-visitor tests: pre-seed onboardingDone so the tour does NOT auto
 * start, then exercise the manual launch points.
 */
test.describe('Tour & help (manual launch)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          'airdeck:settings',
          JSON.stringify({ onboardingDone: true }),
        );
      } catch {
        /* ignore */
      }
    });
  });

  test('TC-024 guided tour launches from the header and navigates', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('tour-tooltip')).toHaveCount(0);
    await page.getByTestId('tour-btn').click();
    await expect(page.getByTestId('tour-tooltip')).toBeVisible();
    await expect(page.getByTestId('tour-image')).toBeVisible();
    await page.screenshot({ path: shot('TC-024-tour'), fullPage: true });

    await page.getByTestId('tour-next').click();
    await page.getByTestId('tour-next').click();
    await expect(page.getByTestId('tour-tooltip')).toBeVisible();

    await page.getByTestId('tour-skip').click();
    await expect(page.getByTestId('tour-tooltip')).toHaveCount(0);
  });

  test('TC-025 help modal opens and can launch the tour', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('help-btn').click();
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await page.getByTestId('onboarding-tour').click();
    await expect(page.getByTestId('onboarding')).toHaveCount(0);
    await expect(page.getByTestId('tour-tooltip')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('tour-tooltip')).toHaveCount(0);
  });
});
