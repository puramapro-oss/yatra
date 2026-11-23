import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { AlertConfig } from '../../src/lib/vacances/alertes-types'
import { alertsFixture } from './alertes-ui-fixtures'

async function mockAlerts(page: Page) {
  const state = { data: structuredClone(alertsFixture), failDelete: false, failGet: false, postCount: 0, holdPost: null as Promise<void> | null }
  await page.route('**/api/vacances/alertes**', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') {
      await route.fulfill({ status: state.failGet ? 503 : 200, json: state.failGet ? { error: 'Alertes momentanément indisponibles. Réessaie.' } : state.data })
    } else if (request.method() === 'POST') {
      state.postCount += 1
      if (state.holdPost) await state.holdPost
      const input = request.postDataJSON() as Pick<AlertConfig, 'aeroport_depart' | 'destination_souhaitee' | 'budget_max_eur'>
      const existing = state.data.configs.find((config) => config.aeroport_depart === input.aeroport_depart && config.destination_souhaitee === input.destination_souhaitee && config.budget_max_eur === input.budget_max_eur)
      const config = existing ?? { ...input, id: 'config-created', actif: true }
      if (!existing) state.data.configs.push(config)
      await route.fulfill({ status: existing ? 200 : 201, json: { config, existing: !!existing } })
    } else if (request.method() === 'DELETE') {
      if (state.failDelete) return route.fulfill({ status: 503, json: { error: 'Suppression indisponible. Réessaie.' } })
      const id = decodeURIComponent(new URL(request.url()).pathname.split('/').at(-1) ?? '')
      state.data.configs = state.data.configs.filter((config) => config.id !== id)
      state.data.notifications = state.data.notifications.filter((notification) => notification.config_id !== id)
      await route.fulfill({ json: { ok: true } })
    } else {
      throw new Error(`Unexpected UI request: ${request.method()}`)
    }
  })
  return state
}

test.beforeEach(async ({ page }) => {
  await page.route('https://**', (route) => route.abort())
})

test('desktop : déduplication, dates exactes, liens sûrs et accessibilité', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await mockAlerts(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Mes alertes (2)' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(3)
  await expect(page.getByRole('link', { name: /Consulter la source/ })).toHaveCount(1)
  await expect(page.getByRole('link', { name: /Consulter la source/ })).toHaveAttribute('href', 'https://example.com/tokyo?fare=499')
  await expect(page.getByText('Le lien de cette source est indisponible.')).toHaveCount(2)
  await expect(page.getByRole('article').first()).toContainText('Prix mentionné : 499,00')
  await expect(page.getByRole('article').first()).toContainText('21 nov. 2026')
  await expect(page.getByRole('article').first()).toContainText('22 nov. 2026, 10:05')
  await expect(page.getByText('Prix non précisé dans la source')).toBeVisible()
  await expect(page.getByLabel('Aéroport ou ville de départ')).toBeVisible()
  await expect(page.getByLabel('Destination souhaitée')).toBeVisible()
  const departure = await page.getByLabel('Aéroport ou ville de départ').boundingBox()
  const destination = await page.getByLabel('Destination souhaitée').boundingBox()
  expect(departure?.y).toBe(destination?.y)
  expect(destination!.x).toBeGreaterThan(departure!.x)
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations).toEqual([])
  expect(errors).toEqual([])
  await page.screenshot({ path: test.info().outputPath('alertes-desktop.png'), fullPage: true })
})

test('mobile : création, double clic, doublon, actualisation et suppression', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const state = await mockAlerts(page)
  await page.goto('/')
  const departure = page.getByLabel('Aéroport ou ville de départ')
  const destination = page.getByLabel('Destination souhaitée')
  const budget = page.getByLabel(/Budget maximal en euros/)
  const departureBox = await departure.boundingBox()
  const destinationBox = await destination.boundingBox()
  expect(destinationBox!.y).toBeGreaterThan(departureBox!.y + departureBox!.height)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(budget).toHaveAttribute('min', '0.01')
  await expect(budget).toHaveAttribute('max', '20000')
  await expect(budget).toHaveAttribute('step', '0.01')
  await departure.fill('  Lyon  ')
  await destination.fill('  Lisbonne  ')
  await budget.fill('100.50')
  let releasePost: () => void = () => undefined
  state.holdPost = new Promise<void>((resolve) => { releasePost = resolve })
  await page.getByRole('button', { name: 'Créer cette alerte' }).click()
  await expect(page.getByRole('button', { name: 'Enregistrement…' })).toBeDisabled()
  await page.locator('form').evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit() })
  await expect.poll(() => state.postCount).toBe(1)
  releasePost()
  state.holdPost = null
  await expect(page.getByRole('heading', { name: 'Mes alertes (3)' })).toBeVisible()
  await expect(departure).toHaveValue('')
  expect(state.data.configs.at(-1)).toMatchObject({ aeroport_depart: 'Lyon', destination_souhaitee: 'Lisbonne', budget_max_eur: 100.5 })
  await departure.fill('Lyon')
  await destination.fill('Lisbonne')
  await budget.fill('100.50')
  await page.getByRole('button', { name: 'Créer cette alerte' }).click()
  await expect(page.getByRole('status')).toHaveText('Cette alerte est déjà enregistrée.')
  await expect(page.getByRole('heading', { name: 'Mes alertes (3)' })).toBeVisible()

  const newDeal = { ...alertsFixture.notifications[0].deal!, id: 'deal-lisbonne', titre: 'Lyon vers Lisbonne', url: 'https://example.com/lisbonne' }
  state.data.notifications.push({ id: 'notification-new', config_id: 'config-created', created_at: newDeal.created_at, deal: newDeal })
  state.failGet = true
  await page.getByRole('button', { name: 'Actualiser les alertes' }).click()
  await expect(page.getByRole('alert')).toContainText('momentanément indisponibles')
  await expect(page.getByRole('heading', { name: 'Mes alertes (3)' })).toBeVisible()
  state.failGet = false
  await page.getByRole('button', { name: 'Actualiser les alertes' }).click()
  await expect(page.getByRole('heading', { name: 'Pistes détectées (4)' })).toBeVisible()
  state.failDelete = true
  const remove = page.getByRole('button', { name: 'Supprimer l’alerte Lyon vers Lisbonne' })
  await remove.click()
  await expect(page.getByRole('alert')).toHaveText('Suppression indisponible. Réessaie.')
  await expect(remove).toBeEnabled()
  state.failDelete = false
  await remove.click()
  await expect(page.getByRole('status')).toHaveText('Alerte supprimée.')
  await expect(remove).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Mes alertes (2)' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pistes détectées (3)' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Lyon vers Lisbonne' })).toHaveCount(0)
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(accessibility.violations).toEqual([])
  await page.screenshot({ path: test.info().outputPath('alertes-mobile.png'), fullPage: true })
})

test('erreur initiale : état explicite puis récupération par actualisation', async ({ page }) => {
  await mockAlerts(page)
  await page.goto('/?scenario=error')
  await expect(page.getByRole('alert')).toContainText('momentanément indisponibles')
  await expect(page.getByText('Actualise pour retrouver tes alertes enregistrées.')).toBeVisible()
  await expect(page.getByText('Choisis un départ et une destination pour créer ta première alerte.')).toHaveCount(0)
  await page.getByRole('button', { name: 'Actualiser les alertes' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Mes alertes (2)' })).toBeVisible()
})

test('session expirée et erreur réseau : messages utiles, données préservées', async ({ page }) => {
  await page.route('**/api/vacances/alertes', (route) => route.fulfill({ status: 401, body: 'Unauthorized' }))
  await page.goto('/')
  await page.getByRole('button', { name: 'Actualiser les alertes' }).click()
  await expect(page.getByRole('alert')).toContainText('Ta session a expiré')
  await page.unroute('**/api/vacances/alertes')
  await page.route('**/api/vacances/alertes', (route) => route.abort('failed'))
  await page.getByRole('button', { name: 'Actualiser les alertes' }).click()
  await expect(page.getByRole('alert')).toContainText('La connexion a été interrompue')
  await expect(page.getByRole('heading', { name: 'Mes alertes (2)' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Actualiser les alertes' })).toBeEnabled()
})

test('requête bloquée : expiration puis nouvelle tentative possible', async ({ page }) => {
  await page.clock.install()
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/vacances/alertes', async (route) => {
    await held
    await route.fulfill({ json: alertsFixture }).catch(() => undefined)
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Actualiser les alertes' }).click()
  await expect(page.getByRole('button', { name: 'Actualisation…' })).toBeDisabled()
  await page.clock.fastForward(15_001)
  await expect(page.getByRole('alert')).toContainText('La réponse tarde')
  await expect(page.getByRole('button', { name: 'Actualiser les alertes' })).toBeEnabled()
  release()
})
