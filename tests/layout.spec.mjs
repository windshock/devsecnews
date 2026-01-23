import { test, expect } from '@playwright/test';
import path from 'path';

const VIEWPORTS = [
    { name: 'Desktop 1080p', width: 1920, height: 1080 },
    { name: 'Laptop 13"', width: 1280, height: 800 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Mobile Portrait', width: 390, height: 844 }, // iPhone 12/13/14
    { name: 'Mobile Landscape', width: 844, height: 390 },
];

const THEMES = [
    { name: 'Light', colorScheme: 'light' },
    { name: 'Dark', colorScheme: 'dark' },
];

test.describe('Layout & Responsiveness Suite', () => {
    const htmlPath = path.resolve('devsecnews-2026-01-node-java.html');

    for (const viewport of VIEWPORTS) {
        for (const theme of THEMES) {
            test(`Layout Check - ${viewport.name} (${theme.name})`, async ({ page }) => {
                // 1. Configure viewport and theme
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.emulateMedia({ colorScheme: theme.colorScheme });

                // 2. Load page
                await page.goto(`file://${htmlPath}`);

                // 3. Verify Body Background Color (Quick Theme Check)
                // We expect either white (light) or dark hex (dark).
                // Since we use CSS variables, we can check computed style.
                const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
                // Note: Playwright returns rgb/rgba strings usually.
                // Light: rgb(255, 255, 255), Dark: rgb(13, 17, 23) (GitHub Dark)

                if (theme.name === 'Dark') {
                    // Basic check: should not be white
                    expect(bodyBg).not.toBe('rgb(255, 255, 255)');
                } else {
                    expect(bodyBg).toBe('rgb(255, 255, 255)');
                }

                // 4. Visibility Checks
                const topbar = page.locator('.topbar');
                await expect(topbar).toBeVisible();
                await expect(topbar).toBeInViewport();

                const mainContent = page.locator('main');
                await expect(mainContent).toBeVisible();

                // 5. Overflow Check (Critical for Mobile)
                // Check if there is unintended horizontal scroll on BODY
                const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
                const clientWidth = await page.evaluate(() => document.body.clientWidth);

                // Allow a tiny buffer (1px) for sub-pixel rendering quirks, but generally should match
                expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

                // 6. Topbar Button Layout
                // On Mobile Portrait, buttons should be visible (wrapped or stacked).
                // We just ensure they are bounding box visible.
                const summaryBtn = page.locator('button[data-view-btn="summary"]');
                await expect(summaryBtn).toBeVisible();

                // 7. TTS Controls Check
                // Should be visible on all sizes (we made them responsive)
                const playBtn = page.locator('#tts-play');
                await expect(playBtn).toBeVisible();
            });
        }
    }
});
