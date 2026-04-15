import { test, expect } from '@playwright/test'

/**
 * E2E tests for /escribe-conmigo — lead magnet funnel page.
 *
 * Covers:
 *   - Page structure and content
 *   - Form field validation (client-side)
 *   - Success flow (mocked worker response)
 *   - Error flow (worker failure)
 *   - Privacy policy link
 *   - Mobile viewport
 */

test.describe('/escribe-conmigo — lead magnet page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/escribe-conmigo/')
  })

  // ── Page structure ────────────────────────────────────────────────────────

  test('loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Escribe conmigo|Purple Heart Journal/i)
  })

  test('shows the emotional headline', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('canciones')
  })

  test('mentions 6 free pages in copy', async ({ page }) => {
    const body = await page.textContent('body')
    expect(body).toMatch(/6 páginas/i)
  })

  test('shows trust note (ARMY, not HYBE)', async ({ page }) => {
    const trust = page.locator('text=Hecho por una ARMY')
    await expect(trust).toBeVisible()
  })

  // ── Form fields ───────────────────────────────────────────────────────────

  test('renders name input', async ({ page }) => {
    await expect(page.locator('#nombre')).toBeVisible()
  })

  test('renders email input', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible()
  })

  test('renders optional consent checkbox (GDPR)', async ({ page }) => {
    await expect(page.locator('#consent-emails')).toBeVisible()
  })

  test('submit button has correct label', async ({ page }) => {
    const btn = page.locator('#submit-btn')
    await expect(btn).toBeVisible()
    await expect(btn).toContainText('Quiero mis 6 páginas')
  })

  test('privacy policy link is present and points to /privacy', async ({ page }) => {
    const privacyLink = page.locator('a[href="/privacy"]')
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toContainText('política de privacidad')
  })

  // ── Client-side validation ────────────────────────────────────────────────

  test('shows nombre error when submitting empty form', async ({ page }) => {
    await page.locator('#submit-btn').click()
    // nombre-error should become visible after empty submit
    const nombreError = page.locator('#nombre-error')
    await expect(nombreError).not.toHaveClass(/hidden/)
  })

  test('shows email error when submitting without email', async ({ page }) => {
    await page.fill('#nombre', 'Victoria')
    await page.locator('#submit-btn').click()
    const emailError = page.locator('#email-error')
    await expect(emailError).not.toHaveClass(/hidden/)
  })

  test('clears nombre error after user starts typing', async ({ page }) => {
    // Trigger error first
    await page.locator('#submit-btn').click()
    // Then fix the field
    await page.fill('#nombre', 'Victoria')
    await page.locator('#nombre').dispatchEvent('input')
    const nombreError = page.locator('#nombre-error')
    await expect(nombreError).toHaveClass(/hidden/)
  })

  test('success and error states are hidden on initial load', async ({ page }) => {
    await expect(page.locator('#success-state')).toHaveClass(/hidden/)
    await expect(page.locator('#error-state')).toHaveClass(/hidden/)
  })

  // ── Success flow (worker mocked) ──────────────────────────────────────────

  test('shows success state after valid submission', async ({ page }) => {
    // Intercept the fetch to the lead capture worker and return 200
    await page.route('**/lead-capture*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.fill('#nombre', 'Victoria')
    await page.fill('#email', 'victoria@example.com')
    await page.locator('#submit-btn').click()

    // Form hides, success message appears
    await expect(page.locator('#success-state')).not.toHaveClass(/hidden/)
    await expect(page.locator('#success-state')).toContainText('Ya está en camino')
  })

  test('hides form after successful submission', async ({ page }) => {
    await page.route('**/lead-capture*', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
    })

    await page.fill('#nombre', 'Victoria')
    await page.fill('#email', 'victoria@example.com')
    await page.locator('#submit-btn').click()

    await expect(page.locator('#lead-form')).toHaveClass(/hidden/)
  })

  // ── Error flow (worker failure) ───────────────────────────────────────────

  test('shows error state when worker returns 500', async ({ page }) => {
    await page.route('**/lead-capture*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error' }),
      })
    })

    await page.fill('#nombre', 'Victoria')
    await page.fill('#email', 'victoria@example.com')
    await page.locator('#submit-btn').click()

    await expect(page.locator('#error-state')).not.toHaveClass(/hidden/)
  })

  test('re-enables submit button after error', async ({ page }) => {
    await page.route('**/lead-capture*', async (route) => {
      await route.fulfill({ status: 500, body: '{}' })
    })

    await page.fill('#nombre', 'Victoria')
    await page.fill('#email', 'victoria@example.com')
    await page.locator('#submit-btn').click()

    await expect(page.locator('#submit-btn')).not.toBeDisabled()
  })

  // ── Loading state ─────────────────────────────────────────────────────────

  test('shows loading text during submission', async ({ page }) => {
    // Delay the worker response to observe loading state
    await page.route('**/lead-capture*', async (route) => {
      await new Promise(r => setTimeout(r, 200))
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
    })

    await page.fill('#nombre', 'Victoria')
    await page.fill('#email', 'victoria@example.com')
    await page.locator('#submit-btn').click()

    // During the request, loading text should appear
    await expect(page.locator('#btn-loading')).not.toHaveClass(/hidden/)
  })
})

// ── Mobile viewport ───────────────────────────────────────────────────────────

test.describe('/escribe-conmigo — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('page renders on mobile', async ({ page }) => {
    await page.goto('/escribe-conmigo/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('#submit-btn')).toBeVisible()
  })

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/escribe-conmigo/')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2)
  })

  test('form inputs are full width on mobile', async ({ page }) => {
    await page.goto('/escribe-conmigo/')
    const nombreWidth = await page.locator('#nombre').evaluate(el => el.getBoundingClientRect().width)
    const emailWidth = await page.locator('#email').evaluate(el => el.getBoundingClientRect().width)
    // Both inputs should be nearly as wide as the viewport
    expect(nombreWidth).toBeGreaterThan(300)
    expect(emailWidth).toBeGreaterThan(300)
  })
})
