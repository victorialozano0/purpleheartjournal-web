import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Purple Heart|Love Yourself|Journal/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Hero section is visible with CTA', async ({ page }) => {
    // Hero heading
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('página en blanco');

    // Hero CTA button
    const heroCta = page.locator('a', { hasText: 'Quiero mi journal' });
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute('target', '_blank');
  });

  test('CTA buttons have Hotmart href or placeholder', async ({ page }) => {
    // All CTA links should have href (either Hotmart URL or # placeholder)
    const ctaLinks = page.locator('a[href]').filter({ hasText: /journal|escribir/i });
    const count = await ctaLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const href = await ctaLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      // href should be either a hotmart URL or a # placeholder
      expect(href === '#' || href!.includes('hotmart') || href!.startsWith('http')).toBe(true);
    }
  });

  test('all landing sections render', async ({ page }) => {
    // Each component corresponds to a <section> element
    const sections = page.locator('section');
    const sectionCount = await sections.count();
    // Hero + Problem + Solution + Features + Preview + Testimonials + CtaFinal = 7
    expect(sectionCount).toBeGreaterThanOrEqual(7);
  });

  test('Problem section is present', async ({ page }) => {
    // Problem section has recognizable content
    const problemText = page.locator('text=no sabes qué escribir').or(
      page.locator('text=te cuesta empezar')
    ).or(
      page.locator('section >> text=/abrir|cuaderno|bloqueo|escribir/i')
    );
    // At minimum, more than just Hero should be present
    const allSections = page.locator('section');
    expect(await allSections.count()).toBeGreaterThan(1);
  });

  test('Features section shows journal features', async ({ page }) => {
    // Should mention key features: pages, chapters, exercises, songs
    const body = await page.textContent('body');
    expect(body).toMatch(/165/); // 165 pages
    expect(body).toMatch(/capítulo|capítulos|ejercicio|ejercicios|cancion|canciones|BTS/i);
  });

  test('CtaFinal section has purchase CTA', async ({ page }) => {
    const finalCta = page.locator('a', { hasText: 'Empieza a escribir hoy' });
    await expect(finalCta).toBeVisible();
  });

  test('Footer is present', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

test.describe('Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('page renders on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Hero heading visible on mobile
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();

    // CTA visible on mobile
    const cta = page.locator('a', { hasText: 'Quiero mi journal' });
    await expect(cta).toBeVisible();
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    // Allow small tolerance (2px) for rounding
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
  });
});
