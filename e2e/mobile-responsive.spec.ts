import { test, expect, devices, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mobile responsive evidence suite.
 *
 * Verifies the phone-first density pass on the photobooth UI (compact header,
 * prominent full-width capture button, horizontally-scrolling filter row,
 * tighter spacing) and writes screenshots to `output/mobile/` so the changes
 * can be reviewed visually. This is the project-runner equivalent of the
 * Playwright-MCP screenshot step (MCP is not available in this workspace).
 *
 * Camera uses Chromium's fake media stream (configured in playwright.config.ts).
 */

const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'output',
  'mobile',
);

function shot(name: string): string {
  return path.join(OUTPUT_DIR, `${name}.png`);
}

// Emulate an iPhone 13 viewport (390x844) for every test in this file.
test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: devices['iPhone 13'].userAgent,
});

async function startCameraReady(page: Page): Promise<void> {
  await page.getByTestId('start-camera').click();
  // The Engine HUD is hidden on mobile, so detect readiness via the capture
  // button (disabled until status === 'ready') and a live video frame.
  await expect(page.getByTestId('capture-btn')).toBeEnabled({
    timeout: 15_000,
  });
  await page.waitForFunction(() => {
    const v = document.querySelector<HTMLVideoElement>(
      '[data-testid="camera-video"]',
    );
    return !!v && v.videoWidth > 0;
  });
}

async function installShareProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: (data?: ShareData) => Boolean(data?.files?.length),
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data?: ShareData) => {
        const file = data?.files?.[0];
        (window as unknown as { __airdeckShareProbe?: unknown }).__airdeckShareProbe = file
          ? { name: file.name, type: file.type, size: file.size }
          : null;
      },
    });
  });
}

async function prepareFramedPhoto(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('section-controls').click();
  await page.getByTestId('timer-0').click();
  await startCameraReady(page);
  await page.getByTestId('capture-btn').click();
  await expect(page.getByTestId('gallery-item').first()).toBeVisible();
  await page.getByTestId('frame-mint').click();
  await page.getByTestId('gallery-item').first().click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('framed-image')).toBeVisible({ timeout: 10_000 });
}

test.describe('AirDeck Photobooth — mobile responsive', () => {
  // Skip the first-run onboarding modal so it doesn't block interactions.
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

  test('MOB-001 compact header on a phone viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /AirDeck/i })).toBeVisible();

    // The header action buttons stay reachable (icon-only on mobile).
    const sound = page.getByTestId('sound-toggle');
    const help = page.getByTestId('help-btn');
    await expect(sound).toBeVisible();
    await expect(help).toBeVisible();

    // The "✨ Tour" shortcut is hidden on mobile to keep the header clean —
    // the tour is still reachable via the help modal (❔ Hướng dẫn).
    await expect(page.getByTestId('tour-btn')).toBeHidden();

    // The "Gesture Photobooth" subtitle and the button text labels are hidden
    // on small screens (display:none) to save horizontal space.
    const subtitle = page.getByText('Gesture Photobooth', { exact: true });
    await expect(subtitle).toBeHidden();

    await page.screenshot({ path: shot('MOB-001-header'), fullPage: true });
  });

  test('MOB-002 capture button is a large full-width tap target', async ({
    page,
  }) => {
    await page.goto('/');
    await startCameraReady(page);

    const capture = page.getByTestId('capture-btn');
    await expect(capture).toBeVisible();

    const stage = page.getByLabel('Camera stage');
    const btnBox = await capture.boundingBox();
    const stageBox = await stage.boundingBox();
    expect(btnBox).not.toBeNull();
    expect(stageBox).not.toBeNull();

    if (btnBox && stageBox) {
      // Comfortably tappable height (>= 44px is the iOS guideline; we render ~52).
      expect(btnBox.height).toBeGreaterThanOrEqual(44);
      // Nearly the full content width on mobile (button shares its row only
      // with the small "stop camera" icon), so it should span most of the stage.
      expect(btnBox.width).toBeGreaterThan(stageBox.width * 0.6);
    }

    await page.screenshot({
      path: shot('MOB-002-capture-button'),
      fullPage: true,
    });
  });

  test('MOB-003 capture works and the photo lands in the gallery', async ({
    page,
  }) => {
    await page.goto('/');
    // The timer lives inside the collapsible "Tùy chọn chụp" section on mobile;
    // expand it (as a user would) to pick instant capture.
    await page.getByTestId('section-controls').click();
    await page.getByTestId('timer-0').click();
    await startCameraReady(page);
    await page.getByTestId('capture-btn').click();
    await expect(page.getByTestId('gallery-item').first()).toBeVisible();
    await expect(page.getByTestId('gallery-item')).toHaveCount(1);
    await page.screenshot({ path: shot('MOB-003-capture'), fullPage: true });
  });

  test('MOB-004 filter row scrolls horizontally without breaking layout', async ({
    page,
  }) => {
    await page.goto('/');
    await startCameraReady(page);

    // The B&W filter chip is reachable (the row scrolls horizontally on mobile).
    const bw = page.getByRole('button', { name: 'B&W' });
    await bw.scrollIntoViewIfNeeded();
    await bw.click();
    const filterValue = await page
      .getByTestId('camera-video')
      .evaluate((el) => (el as HTMLElement).style.filter);
    expect(filterValue).toContain('grayscale');

    await page.screenshot({ path: shot('MOB-004-filter-row'), fullPage: true });
  });

  test('MOB-005 controls stack vertically and stay within the viewport width', async ({
    page,
  }) => {
    await page.goto('/');

    // No horizontal overflow: the document should not be wider than the viewport.
    const { scrollW, clientW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    // Allow a 1px rounding tolerance.
    expect(scrollW).toBeLessThanOrEqual(clientW + 1);

    await page.screenshot({
      path: shot('MOB-005-no-horizontal-overflow'),
      fullPage: true,
    });
  });

  test('MOB-006 secondary panels are collapsed, no Engine HUD on mobile', async ({
    page,
  }) => {
    await page.goto('/');

    // The collapsible section headers are visible on mobile…
    const controls = page.getByTestId('section-controls');
    const gestures = page.getByTestId('section-gestures');
    const accessories = page.getByTestId('section-accessories');
    const strip = page.getByTestId('section-strip');
    await expect(controls).toBeVisible();
    await expect(gestures).toBeVisible();
    await expect(accessories).toBeVisible();
    await expect(strip).toBeVisible();

    // The developer Engine HUD is dropped entirely on mobile to keep it simple.
    await expect(page.getByTestId('section-engine')).toHaveCount(0);
    await expect(page.getByTestId('hud-camera')).toHaveCount(0);

    // …and sections start collapsed, so their inner controls are hidden.
    await expect(page.getByTestId('timer-3')).toBeHidden();
    await expect(page.getByTestId('strip-download')).toBeHidden();

    // Measure how tall the page is while collapsed (proof it's compact).
    const collapsedHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );

    await page.screenshot({ path: shot('MOB-006-collapsed'), fullPage: true });

    // Expanding a section reveals its controls on tap.
    await controls.click();
    await expect(page.getByTestId('timer-3')).toBeVisible();
    await page.getByTestId('timer-3').scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot('MOB-006-expanded'), fullPage: true });

    // Re-collapse and confirm the page returns to its short height.
    await controls.click();
    await expect(page.getByTestId('timer-3')).toBeHidden();
    const recollapsedHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    expect(Math.abs(recollapsedHeight - collapsedHeight)).toBeLessThan(40);
  });

  test('MOB-007 tour spotlights every step (auto-expands collapsed sections)', async ({
    page,
  }) => {
    await page.goto('/');

    // Open the help modal, then launch the guided tour.
    await page.getByTestId('help-btn').click();
    await expect(page.getByTestId('onboarding')).toBeVisible();
    await page.getByTestId('onboarding-tour').click();

    // Step through the whole tour. On mobile several targets live inside
    // collapsed sections — those sections auto-expand during the tour so the
    // spotlight lands on the real control. Every step except the centered
    // "welcome" card (step 0, no target) must show a spotlight, and the tooltip
    // must stay within the 390px-wide viewport.
    for (let i = 0; i < 12; i += 1) {
      const tooltip = page.getByTestId('tour-tooltip');
      if (!(await tooltip.isVisible().catch(() => false))) break;

      const box = await tooltip.boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(-1);
        expect(box.y).toBeGreaterThanOrEqual(-1);
        expect(box.x + box.width).toBeLessThanOrEqual(390 + 1);
      }

      // Steps beyond the welcome card target a real element and must spotlight.
      if (i > 0) {
        await expect(page.getByTestId('tour-spotlight')).toBeVisible();
      }

      await page.screenshot({ path: shot(`MOB-007-tour-step-${i}`) });

      const next = page.getByTestId('tour-next');
      if (await next.isVisible().catch(() => false)) {
        await next.click();
      } else {
        break;
      }
    }
  });

  test('MOB-008 collapsed sections revert after the tour ends', async ({
    page,
  }) => {
    await page.goto('/');

    // Sections start collapsed.
    await expect(page.getByTestId('timer-3')).toBeHidden();

    // Launch the tour -> sections auto-expand so the spotlight works.
    await page.getByTestId('help-btn').click();
    await page.getByTestId('onboarding-tour').click();
    await expect(page.getByTestId('tour-tooltip')).toBeVisible();
    await expect(page.getByTestId('timer-3')).toBeVisible();

    // End the tour -> sections collapse back to the user's state.
    await page.getByTestId('tour-skip').click();
    await expect(page.getByTestId('tour-tooltip')).toHaveCount(0);
    await expect(page.getByTestId('timer-3')).toBeHidden();
  });

  test('MOB-009 iPhone save creates a JPEG File through Web Share', async ({
    page,
  }) => {
    await installShareProbe(page);
    await prepareFramedPhoto(page);

    await page.getByTestId('download-btn').click();

    const shared = await page.waitForFunction(() => {
      return (window as unknown as { __airdeckShareProbe?: unknown }).__airdeckShareProbe;
    });
    const value = (await shared.jsonValue()) as {
      name: string;
      type: string;
      size: number;
    };
    expect(value.name).toMatch(/^airdeck-\d{8}-\d{6}\.jpg$/);
    expect(value.type).toBe('image/jpeg');
    expect(value.size).toBeGreaterThan(0);

    await page.screenshot({ path: shot('MOB-009-iphone-save-share'), fullPage: true });
  });
});

test.describe('AirDeck Photobooth — Android mobile save evidence', () => {
  test.use({
    viewport: devices['Pixel 5'].viewport,
    deviceScaleFactor: devices['Pixel 5'].deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['Pixel 5'].userAgent,
  });

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

  test('MOB-010 Android save creates a JPEG File through Web Share', async ({ page }) => {
    await installShareProbe(page);
    await prepareFramedPhoto(page);

    await page.getByTestId('download-btn').click();

    const shared = await page.waitForFunction(() => {
      return (window as unknown as { __airdeckShareProbe?: unknown }).__airdeckShareProbe;
    });
    const value = (await shared.jsonValue()) as {
      name: string;
      type: string;
      size: number;
    };
    expect(value.name).toMatch(/^airdeck-\d{8}-\d{6}\.jpg$/);
    expect(value.type).toBe('image/jpeg');
    expect(value.size).toBeGreaterThan(0);

    await page.screenshot({ path: shot('MOB-010-android-save-share'), fullPage: true });
  });
});
