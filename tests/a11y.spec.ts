import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibilité WCAG 2.2 AA', () => {
  test('Page d\'accueil - 0 violation critique/sérieuse', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Attendre que la page soit chargée (cinematic intro peut prendre du temps)
    await page.waitForTimeout(4000)

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const criticalAndSerious = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalAndSerious).toEqual([])
  })

  test('Page login - 0 violation critique/sérieuse', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const criticalAndSerious = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalAndSerious).toEqual([])
  })

  test('Page signup - 0 violation critique/sérieuse', async ({ page }) => {
    await page.goto('http://localhost:3000/signup')
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    const criticalAndSerious = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(criticalAndSerious).toEqual([])
  })

  test('Navigation clavier - home → login', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(4000) // Attendre fin cinematic intro

    // Tab devrait atteindre le lien "Se connecter"
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Vérifier que le focus est sur un élément interactif
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON']).toContain(focusedElement)
  })

  test('Navigation clavier - formulaire login', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    // Tab à travers le formulaire
    await page.keyboard.press('Tab') // Retour link ou langue selector
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Vérifier qu'on peut atteindre des éléments interactifs
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toMatch(/^(A|BUTTON|INPUT)$/)
  })
})
