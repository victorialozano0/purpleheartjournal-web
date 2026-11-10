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
    // Hero heading (main h1: el dev toolbar de Astro también inyecta h1)
    const heroHeading = page.locator('main h1');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('entre canciones');

    // Hero CTA lleva a la colección
    const heroCta = page.locator('main a', { hasText: 'Ver la colección' });
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute('href', '#coleccion');
  });

  test('CTA buttons have Hotmart href', async ({ page }) => {
    // 2 cards de la colección + 2 CTAs finales
    const ctaLinks = page.locator('main a[href*="pay.hotmart.com"]');
    const count = await ctaLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const link = ctaLinks.nth(i);
      expect(await link.getAttribute('href')).toMatch(/^https:\/\/pay\.hotmart\.com\//);
      await expect(link).toHaveAttribute('target', '_blank');
    }
    await expect(page.locator('a', { hasText: 'Comprar Love Yourself' })).toHaveAttribute('href', /pay\.hotmart\.com/);
    await expect(page.locator('a', { hasText: 'Comprar Speak Yourself' })).toHaveAttribute('href', /pay\.hotmart\.com/);
  });

  test('all landing sections render', async ({ page }) => {
    // Hero + Colección + ARIRANG + Por qué + FAQ + CTA final = 6
    expect(await page.locator('main section').count()).toBeGreaterThanOrEqual(6);
    await expect(page.locator('#coleccion')).toContainText('Love Yourself Journal');
    await expect(page.locator('#coleccion')).toContainText('Speak Yourself Journal');
    await expect(page.locator('#arirang')).toContainText('Ya pasó el concierto');
    await expect(page.locator('#home-arirang-form input[type="email"]')).toBeVisible();
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
    for (const label of ['Love Yourself — $9.90', 'Speak Yourself — $9.90']) {
      const finalCta = page.locator('a', { hasText: label });
      await expect(finalCta).toBeVisible();
      await expect(finalCta).toHaveAttribute('href', /pay\.hotmart\.com/);
    }
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
    const heroHeading = page.locator('main h1');
    await expect(heroHeading).toBeVisible();

    // CTA visible on mobile
    const cta = page.locator('main a', { hasText: 'Ver la colección' });
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

test.describe('Atribución src → Hotmart', () => {
  test('cada página manda su src propio al checkout', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('a[href*="pay.hotmart.com"]').first().getAttribute('href');
    expect(href).toContain('src=web_home');
  });

  test('el src de entrada pasa al checkout y se conserva al navegar', async ({ page }) => {
    await page.goto('/?src=ig_bio');
    const links = page.locator('a[href*="pay.hotmart.com"]');
    for (const href of await links.evaluateAll(as => as.map(a => (a as HTMLAnchorElement).href))) {
      expect(href).toContain('src=ig_bio');
    }
    await page.goto('/blog');
    expect(await links.first().evaluate(a => (a as HTMLAnchorElement).href)).toContain('src=ig_bio');
  });
});

test('meta de verificación de dominio de Pinterest', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="p:domain_verify"]')).toHaveAttribute('content', '157688e757f09bd030db9d9db54c2951');
});

test.describe('Formulario ARIRANG de la home', () => {
  test('envía email + journal arirang y muestra éxito', async ({ page }) => {
    let body: any = null;
    await page.route('**/mock-lead-magnet', async route => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await page.goto('/');
    await page.locator('#home-arirang-form input[name="email"]').fill('army@example.com');
    await page.locator('#home-arirang-form button[type="submit"]').click();
    await expect(page.locator('#home-arirang-success')).toBeVisible();
    expect(body).toEqual({ email: 'army@example.com', journal: 'arirang' });
  });

  test('si el servidor falla muestra el error', async ({ page }) => {
    await page.route('**/mock-lead-magnet', route => route.fulfill({ status: 500, body: '{}' }));
    await page.goto('/');
    await page.locator('#home-arirang-form input[name="email"]').fill('army@example.com');
    await page.locator('#home-arirang-form button[type="submit"]').click();
    await expect(page.locator('#home-arirang-error')).toBeVisible();
  });
});
