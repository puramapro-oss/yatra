/**
 * UAT YATRA P1→P5 — exécution séquentielle, 1 user de test, 1 trace cohérente.
 *
 * Ne pas paralléliser : tests dépendants (auth → onboarding → trajet → wallet → aides).
 *
 * Lancer : npx playwright test --config=playwright.uat.config.ts
 */

import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  generateBikeGps, generateCarGps,
  adminSupabase, type TestUser,
} from './_helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://yatra.purama.dev'

// Lecture user créé par globalSetup
const user: TestUser = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/uat/output/.uat-user.json'), 'utf8'),
)
let consoleErrors: string[] = []

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page }) => {
  consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(`pageerror: ${err.message}`)
  })
})

// ╔══════════════════════════════════════════════════════════════╗
// ║ P1 — AUTH (email + Google bouton + logout)                  ║
// ╚══════════════════════════════════════════════════════════════╝
test.describe('P1 — Auth', () => {
  test('Page login affiche formulaire email + bouton Google', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page).toHaveTitle(/YATRA|Connexion/i)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Le bouton Google doit exister (pas testé interactif — Google headless impossible)
    const googleBtn = page.getByRole('button', { name: /google/i })
    await expect(googleBtn).toBeVisible()

    await page.screenshot({ path: 'tests/uat/output/p1-login.png', fullPage: true })
  })

  test('Connexion email réussit + redirige vers /onboarding (premier login)', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
    expect(page.url()).toMatch(/\/(dashboard|onboarding)/)
    await page.screenshot({ path: 'tests/uat/output/p1-after-login.png', fullPage: true })
  })

  test('Routes protégées redirigent /login si non auth', async ({ browser }) => {
    const ctx = await browser.newContext()
    const p = await ctx.newPage()
    for (const path of ['/dashboard', '/dashboard/wallet', '/dashboard/aides', '/dashboard/trajet']) {
      const r = await p.goto(`${BASE}${path}`)
      expect(r?.status()).toBeLessThan(500)
      await p.waitForURL(/\/login/, { timeout: 5000 })
    }
    await ctx.close()
  })
})

// ╔══════════════════════════════════════════════════════════════╗
// ║ P2 — VIDA CORE : onboarding 5 écrans + Moment WOW           ║
// ╚══════════════════════════════════════════════════════════════╝
test.describe('P2 — VIDA CORE', () => {
  test('Onboarding 5 écrans + Moment WOW + redirect dashboard', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' })

    // Étape 0 — Nom
    const nameInput = page.locator('input[type="text"]').first()
    await nameInput.fill('Camille UAT')
    await page.screenshot({ path: 'tests/uat/output/p2-step0-name.png' })
    await page.getByRole('button', { name: /continuer/i }).first().click()

    // Étape 1 — Habitudes (ville + km via slider — input range)
    await page.waitForTimeout(500)
    const villeInput = page.locator('input[type="text"]').first()
    await villeInput.fill('Paris')
    // Slider km_propre_semaine
    const sliders = page.locator('input[type="range"]')
    const sliderCount = await sliders.count()
    if (sliderCount > 0) {
      // Set km_propre via fill (Playwright sait écrire dans range)
      await sliders.nth(0).evaluate((el: HTMLInputElement) => {
        el.value = '50'
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      })
    }
    // Sélectionne "Vélo"
    await page.locator('button', { hasText: /vélo|velo/i }).first().click().catch(() => null)
    await page.screenshot({ path: 'tests/uat/output/p2-step1-habitudes.png' })
    await page.getByRole('button', { name: /continuer/i }).first().click()

    // Étape 2 — Préférences (ambiance + binaural + voix)
    await page.waitForTimeout(500)
    await page.locator('button', { hasText: /forêt|foret/i }).first().click().catch(() => null)
    await page.screenshot({ path: 'tests/uat/output/p2-step2-preferences.png' })
    await page.getByRole('button', { name: /continuer/i }).first().click()

    // Étape 3 — Permissions → bouton "Voir mon Moment WOW"
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'tests/uat/output/p2-step3-permissions.png' })
    await page.getByRole('button', { name: /voir mon moment|moment wow/i }).first().click()

    // Étape 4 — Moment WOW affiché (calc API) → "Activer mon compte"
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'tests/uat/output/p2-step4-wow.png' })
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/€|kg|aide/i)

    await page.getByRole('button', { name: /activer mon compte/i }).first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 20000 })

    // Vérification DB : profile.onboarding_completed = true
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('onboarding_completed, full_name, ville_principale, score_humanite, rang')
      .eq('id', user.id)
      .maybeSingle()
    expect(profile?.onboarding_completed).toBe(true)
    expect(profile?.ville_principale).toBe('Paris')
    expect(profile?.full_name).toContain('Camille')

    // Vérif fil_de_vie a bien l'event onboarding_completed
    const { data: events } = await adminSupabase
      .from('fil_de_vie')
      .select('event_type')
      .eq('user_id', user.id)
      .eq('event_type', 'onboarding_completed')
    expect((events ?? []).length).toBeGreaterThan(0)

    // Vérif score_humanite_history a au moins 1 entrée
    const { count: scoreCount } = await adminSupabase
      .from('score_humanite_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    expect(scoreCount ?? 0).toBeGreaterThan(0)

    // Vérif adn_mobilite créée
    const { data: adn } = await adminSupabase
      .from('adn_mobilite')
      .select('rythme_appris, modes_preferes')
      .eq('user_id', user.id)
      .maybeSingle()
    expect(adn).toBeTruthy()
  })

  test('Page profile affiche rang + score + fil de vie', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/profile`, { waitUntil: 'networkidle' })
    const txt = await page.textContent('body')
    expect(txt).toMatch(/score|rang|explorateur|gardien|niveau/i)
    await page.screenshot({ path: 'tests/uat/output/p2-profile.png', fullPage: true })
  })
})

// ╔══════════════════════════════════════════════════════════════╗
// ║ P3 — Trajet, GPS tracking, anti-fraude                      ║
// ╚══════════════════════════════════════════════════════════════╝
test.describe('P3 — Trajet + GPS + Anti-fraude', () => {
  test('API /trip/route retourne combinaisons multi-modal', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const r = await page.request.post(`${BASE}/api/vida/trip/route`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: {
        from: { label: 'Paris Châtelet', lat: 48.8584, lon: 2.3470 },
        to: { label: 'Paris Bastille', lat: 48.8533, lon: 2.3691 },
      },
    })
    expect(r.ok()).toBeTruthy()
    const data = await r.json()
    expect(Array.isArray(data.combinations)).toBeTruthy()
    expect(data.combinations.length).toBeGreaterThan(1)
    // Au moins 1 combo a un gain > 0 (mode propre)
    const cleanCombos = data.combinations.filter((c: { gain_credits_eur: number; mode_dominant: string }) => c.gain_credits_eur > 0)
    expect(cleanCombos.length).toBeGreaterThan(0)
    // Au moins 1 a tag 'cheapest' et 1 'cleanest'
    const allTags = data.combinations.flatMap((c: { tags: string[] }) => c.tags)
    expect(allTags).toContain('cheapest')
    expect(allTags).toContain('cleanest')
  })

  test('Trajet vélo propre crédite Vida Credits (≤ fraud threshold)', async ({ page }) => {
    await loginIfNeeded(page)

    // 1. Créer trip via API
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const startR = await page.request.post(`${BASE}/api/vida/trip/start`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: {
        declared_mode: 'velo',
        from_label: 'UAT Bike Start',
        to_label: 'UAT Bike End',
        from_lat: 48.8566, from_lon: 2.3522,
        to_lat: 48.8666, to_lon: 2.3622,
      },
    })
    expect(startR.ok()).toBeTruthy()
    const { trip_id } = await startR.json()
    expect(trip_id).toBeTruthy()

    // 2. Générer trace vélo réaliste 5 km à 18 km/h
    const points = generateBikeGps({ speedKmh: 18, durationSec: 1020 })
    expect(points.length).toBeGreaterThan(50)

    // 3. End trip → analyse anti-fraude
    const endR = await page.request.post(`${BASE}/api/vida/trip/end`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: { trip_id, points },
    })
    expect(endR.ok()).toBeTruthy()
    const endData = await endR.json()
    expect(endData.status).toBe('completed')
    expect(endData.fraud_score).toBeLessThan(60)
    expect(Number(endData.gain_credits_eur)).toBeGreaterThan(0)
    expect(endData.detected_mode).toBeDefined()

    // 4. Verif DB : wallet_transactions credit + balance > 0
    const { data: tx } = await adminSupabase
      .from('wallet_transactions')
      .select('type, amount, source')
      .eq('user_id', user.id)
      .eq('source', 'trip_clean')
      .order('created_at', { ascending: false })
      .limit(1)
    expect((tx ?? []).length).toBe(1)
    expect(tx![0].type).toBe('credit')
    expect(Number(tx![0].amount)).toBeGreaterThan(0)
  })

  test('Trajet voiture déclaré comme vélo → flagged (fraud_score >= 60)', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const startR = await page.request.post(`${BASE}/api/vida/trip/start`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: {
        declared_mode: 'velo', // ❌ déclaré vélo mais on va envoyer trace 95 km/h
        from_label: 'UAT Fraud Start',
        to_label: 'UAT Fraud End',
        from_lat: 48.8566, from_lon: 2.3522,
        to_lat: 48.9, to_lon: 2.4,
      },
    })
    const { trip_id } = await startR.json()

    // Trace voiture rapide 95 km/h sur 10 min
    const points = generateCarGps({ speedKmh: 95, durationSec: 600 })

    const endR = await page.request.post(`${BASE}/api/vida/trip/end`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: { trip_id, points },
    })
    expect(endR.ok()).toBeTruthy()
    const endData = await endR.json()
    expect(endData.status).toBe('flagged')
    expect(endData.fraud_score).toBeGreaterThanOrEqual(60)
    expect(Number(endData.gain_credits_eur)).toBe(0)
    expect(Array.isArray(endData.reasons)).toBeTruthy()
    expect(endData.reasons.length).toBeGreaterThan(0)
  })

  test('UI /dashboard/trajet affiche recherche from/to + suggestions', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/trajet`, { waitUntil: 'networkidle' })
    await expect(page.locator('input').first()).toBeVisible()
    await page.screenshot({ path: 'tests/uat/output/p3-trajet.png', fullPage: true })
  })

  test('UI /dashboard/trajets affiche historique avec totaux', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/trajets`, { waitUntil: 'networkidle' })
    const txt = await page.textContent('body')
    expect(txt).toMatch(/trajets|km|gagné/i)
    await page.screenshot({ path: 'tests/uat/output/p3-trajets-list.png', fullPage: true })
  })
})

// ╔══════════════════════════════════════════════════════════════╗
// ║ P4 — Wallet + retraits + multiplicateur ancienneté          ║
// ╚══════════════════════════════════════════════════════════════╝
test.describe('P4 — Wallet', () => {
  test('GET /api/wallet retourne balance + transactions + multiplicateur', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const r = await page.request.get(`${BASE}/api/wallet`, {
      headers: { Cookie: cookieHeader },
    })
    expect(r.ok()).toBeTruthy()
    const data = await r.json()
    expect(data.wallet).toBeTruthy()
    expect(typeof Number(data.wallet.balance)).toBe('number')
    expect(Array.isArray(data.recent_transactions)).toBeTruthy()
  })

  test('POST /withdraw avec IBAN invalide → 400 erreur explicite', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    // IBAN 27 chars (longueur FR) mais checksum invalide → passe Zod, échoue mod-97
    const r = await page.request.post(`${BASE}/api/wallet/withdraw`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: { amount: 5, iban: 'FR9999999999999999999999999', holder_name: 'UAT User' },
    })
    expect(r.status()).toBe(400)
    const err = await r.json()
    expect(err.error).toMatch(/iban|contr[ôo]le/i)
  })

  test('POST /withdraw bloqué si < 3 trips clean', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    // IBAN fictif valide algorithm wise: FR1420041010050500013M02606 (exemple test mod-97 valide)
    const r = await page.request.post(`${BASE}/api/wallet/withdraw`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: { amount: 5, iban: 'FR1420041010050500013M02606', holder_name: 'UAT User' },
    })
    // user de test n'a qu'1 trip clean → 403
    expect([403, 400]).toContain(r.status())
    const err = await r.json()
    expect(err.error).toMatch(/trajet|propre|3|clean/i)
  })

  test('UI /dashboard/wallet affiche balance hero + sources', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/wallet`, { waitUntil: 'networkidle' })
    const txt = await page.textContent('body')
    expect(txt).toMatch(/wallet|solde|€|trajets/i)
    await page.screenshot({ path: 'tests/uat/output/p4-wallet.png', fullPage: true })
  })

  test('Multiplicateur ancienneté = 1.0 pour user neuf (0 mois)', async () => {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('anciennete_months')
      .eq('id', user.id)
      .maybeSingle()
    // Pour un user neuf, anciennete_months = 0 → ×1
    expect(Number(profile?.anciennete_months ?? 0)).toBeLessThanOrEqual(1)
  })
})

// ╔══════════════════════════════════════════════════════════════╗
// ║ P5 — Aides + Tavily + détection ville                        ║
// ╚══════════════════════════════════════════════════════════════╝
test.describe('P5 — Aides + Tavily', () => {
  test('GET /api/aides retourne aides matchées (≥ 5) avec score', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const r = await page.request.get(`${BASE}/api/aides?limit=30`, {
      headers: { Cookie: cookieHeader },
    })
    expect(r.ok()).toBeTruthy()
    const data = await r.json()
    expect(Array.isArray(data.aides)).toBeTruthy()
    expect(data.aides.length).toBeGreaterThanOrEqual(5)

    // Vérif région détectée Paris → IDF
    expect(data.profile_used.region).toBe('IDF')

    // Toutes les aides ont un score
    for (const a of data.aides) {
      expect(typeof a._score).toBe('number')
      expect(a._score).toBeGreaterThanOrEqual(20)
      expect(Array.isArray(a._reasons)).toBeTruthy()
    }

    // Au moins 1 aide IDF (Navigo, Vélib, ChèqueMobilité)
    const idfAides = data.aides.filter((a: { region: string | null }) => a.region === 'IDF')
    expect(idfAides.length).toBeGreaterThan(0)
  })

  test('GET /api/aides?category=transport filtre bien', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const r = await page.request.get(`${BASE}/api/aides?category=transport&limit=50`, {
      headers: { Cookie: cookieHeader },
    })
    const data = await r.json()
    expect(data.aides.every((a: { category: string }) => a.category === 'transport')).toBeTruthy()
  })

  test('UI /dashboard/aides : KPI + filtres + cards', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/aides`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    const txt = await page.textContent('body')
    expect(txt).toMatch(/aide|détecté|potentiel|transport/i)
    await page.screenshot({ path: 'tests/uat/output/p5-aides-list.png', fullPage: true })

    // Cliquer sur un filtre catégorie
    await page.getByRole('button', { name: /transport/i }).first().click().catch(() => null)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/uat/output/p5-aides-transport.png', fullPage: true })
  })

  test('UI /dashboard/aides/[slug] : détail + bouton officiel', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/aides/bonus-velo-2026`, { waitUntil: 'networkidle' })
    const txt = await page.textContent('body')
    expect(txt).toMatch(/bonus|vélo|400|prime/i)
    // Bouton externe officiel
    const officialLink = page.locator('a[href*="service-public.fr"]').first()
    await expect(officialLink).toBeVisible()
    await page.screenshot({ path: 'tests/uat/output/p5-aide-detail.png', fullPage: true })
  })

  test('Follow + applied flow', async ({ page }) => {
    await loginIfNeeded(page)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

    const r1 = await page.request.post(`${BASE}/api/aides/bonus-velo-2026/follow`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: { status: 'following' },
    })
    expect(r1.ok()).toBeTruthy()

    const r2 = await page.request.post(`${BASE}/api/aides/bonus-velo-2026/follow`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      data: { status: 'applied' },
    })
    expect(r2.ok()).toBeTruthy()

    // Vérif fil_de_vie a aide_followed et aide_applied
    const { data: events } = await adminSupabase
      .from('fil_de_vie')
      .select('event_type')
      .eq('user_id', user.id)
      .in('event_type', ['aide_followed', 'aide_applied'])
    expect((events ?? []).length).toBeGreaterThanOrEqual(2)

    // Cleanup
    await page.request.delete(`${BASE}/api/aides/bonus-velo-2026/follow`, {
      headers: { Cookie: cookieHeader },
    })
  })

  test('CRON Tavily fetch en réel avec Bearer CRON_SECRET', async ({ request }) => {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      test.skip()
      return
    }
    const r = await request.post(`${BASE}/api/cron/aides-research`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    expect(r.ok()).toBeTruthy()
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(typeof data.total_inserted).toBe('number')
    expect(Array.isArray(data.by_query)).toBeTruthy()
    expect(data.by_query.length).toBe(5)
  })

  test('CRON Tavily refuse sans Bearer', async ({ request }) => {
    const r = await request.post(`${BASE}/api/cron/aides-research`)
    expect(r.status()).toBe(401)
  })
})

// ╔══════════════════════════════════════════════════════════════╗
// ║ Final — console errors check                                ║
// ╚══════════════════════════════════════════════════════════════╝
test.describe('Final', () => {
  test('Aucune erreur console critique sur dashboard', async ({ page }) => {
    consoleErrors = []
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Filtre les erreurs cosmétiques (favicon 404, react devtools, network noise transient)
    const significant = consoleErrors.filter((e) =>
      !/favicon|devtools|google-analytics|posthog|sentry|net::ERR_BLOCKED|hydration text content/i.test(e),
    )
    if (significant.length > 0) {
      console.log('⚠ Erreurs console restantes:', significant.slice(0, 5))
    }
    expect(significant).toEqual([])
  })
})

// Helper : login dans page si pas déjà loggé (pour tests indépendants)
async function loginIfNeeded(page: Page) {
  await page.goto(`${BASE}/dashboard`).catch(() => null)
  if (page.url().includes('/login')) {
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
  }
}
