import { test } from '@playwright/test';

// Directeur Artistique — Screenshot suite for V3 signature screens
// Viewports: 375px (mobile) / 768px (tablet) / 1440px (desktop)

const viewports = [
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

test.describe('DA — V3 Signature Screens', () => {
  viewports.forEach(viewport => {
    test.describe(viewport.name, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      // Screen 1: Home page (public, NLU hero search visible)
      test('home', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `tests/uat/output/v3-da/01-home-${viewport.name}.png`,
          fullPage: false,
        });
      });

      // Screen 2: Login page (glass design, auth form)
      test('login', async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `tests/uat/output/v3-da/02-login-${viewport.name}.png`,
          fullPage: false,
        });
      });

      // Screen 3: Signup page
      test('signup', async ({ page }) => {
        await page.goto('http://localhost:3000/signup');
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `tests/uat/output/v3-da/03-signup-${viewport.name}.png`,
          fullPage: false,
        });
      });

      // Screen 4: Pricing page (comparateur, cards)
      test('pricing', async ({ page }) => {
        await page.goto('http://localhost:3000/pricing');
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `tests/uat/output/v3-da/04-pricing-${viewport.name}.png`,
          fullPage: false,
        });
      });

      // Screen 5: Privacy/legal page (static, design polish check)
      test('privacy', async ({ page }) => {
        await page.goto('http://localhost:3000/privacy');
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `tests/uat/output/v3-da/05-privacy-${viewport.name}.png`,
          fullPage: false,
        });
      });
    });
  });
});
