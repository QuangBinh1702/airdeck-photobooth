import { test, expect, type Page } from '@playwright/test';

/**
 * E2E for the AirDeck shell + photo studio.
 *
 * Chromium is launched with --use-fake-device-for-media-stream so getUserMedia
 * resolves to a synthetic camera with no physical hardware. The MediaPipe model
 * is NOT loaded here (network model download is out of scope for hermetic CI);
 * these tests cover the UI shell, camera lifecycle, manual capture, filters,
 * frames, gallery selection/download and accessibility — the deterministic,
 * camera-independent surface.
 *
 * Gesture-driven capture depends on live model inference and is documented as a
 * manual / Playwright-MCP scenario in docs/test_cases.
 */

/** Set the self-timer to "instant" so capture happens without a countdown. */
async function setInstantTimer(page: Page): Promise<void> {
  await page.getByTestId('timer-0').click();
}

test.describe('AirDeck shell', () => {
  test('renders header, modes and on-device privacy note', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /AirDeck/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Photo Studio' })).toBeVisible();
    await expect(page.getByText(/không rời khỏi trình duyệt/i)).toBeVisible();
  });

  test('switches modes and updates the gesture cheatsheet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Slides' }).click();
    await expect(page.getByRole('button', { name: 'Slides' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // Slides mode maps a swipe -> next slide; cheatsheet should reflect mode.
    await expect(page.getByText(/Cử chỉ · slides/i)).toBeVisible();
  });
});

test.describe('Camera + capture', () => {
  test('starts the fake camera and reaches ready state', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-camera').click();
    await expect(page.getByTestId('hud-camera')).toHaveText(/ready/i, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('camera-video')).toBeVisible();
  });

  test('manual capture adds an image to the gallery', async ({ page }) => {
    await page.goto('/');
    await setInstantTimer(page);
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
    await page.getByTestId('capture-btn').click();
    await expect(page.getByTestId('gallery').locator('img')).toHaveCount(1);
  });

  test('applies a filter to the live preview', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-camera').click();
    await page.getByRole('button', { name: 'B&W' }).click();
    const filterValue = await page
      .getByTestId('camera-video')
      .evaluate((el) => (el as HTMLElement).style.filter);
    expect(filterValue).toContain('grayscale');
  });
});

test.describe('Photobooth: timer, frame, select, download', () => {
  test('selecting a timer marks it active', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('timer-5').click();
    await expect(page.getByTestId('timer-5')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('captured photo can be selected and framed for download', async ({
    page,
  }) => {
    await page.goto('/');
    await setInstantTimer(page);
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

    // Capture, then pick a decorative frame.
    await page.getByTestId('capture-btn').click();
    await expect(page.getByTestId('gallery-item').first()).toBeVisible();
    await page.getByTestId('frame-mint').click();

    // Selecting the gallery item shows the framed preview + enables download.
    await page.getByTestId('gallery-item').first().click();
    await expect(page.getByTestId('framed-image')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('download-btn')).toBeEnabled();
  });

  test('a captured photo can be deleted from the gallery', async ({ page }) => {
    await page.goto('/');
    await setInstantTimer(page);
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
    await page.getByTestId('capture-btn').click();
    await expect(page.getByTestId('gallery-item')).toHaveCount(1);
    await page.getByTestId('gallery-item').first().hover();
    await page.getByTestId('gallery-delete').first().click();
    await expect(page.getByTestId('gallery-item')).toHaveCount(0);
  });
});

test.describe('Accessibility / fallback', () => {
  test('capture button is disabled until the camera is ready', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('capture-btn')).toBeDisabled();
  });
});
