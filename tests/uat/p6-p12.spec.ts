/**
 * UAT P13 — couvre les phases P6 à P12 (suite tests P1-P5 dans full.spec.ts).
 * Lecture seule. Pas de mutation pour éviter pollution prod.
 */

import { test, expect, type Page } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { TestUser } from './_helpers'

const BASE = process.env.UAT_BASE_URL ?? 'https://yatra.purama.dev'

const userPath = join(process.cwd(), 'tests/uat/output/.uat-user.json')
let user: TestUser | null = null
if (existsSync(userPath)) {
  user = JSON.parse(readFileSync(userPath, 'utf8'))
}

test.describe.configure({ mode: 'serial' })

async function loginIfNeeded(page: Page) {
  if (!user) return
  await page.goto(`${BASE}/dashboard`).catch(() => null)
  if (page.url().includes('/login')) {
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
  }
}

test.describe('P6 — Gratuit + Groupes', () => {
  test('/dashboard/gratuit charge', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/gratuit`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/gratuit')
  })
  test('/dashboard/groupes liste pools', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/groupes`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/groupes')
  })
})

test.describe('P7 — Cashback + Humanitaire', () => {
  test('/dashboard/cashback partenaires', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/cashback`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/cashback')
  })
  test('/dashboard/humanitaire missions', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/humanitaire`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/humanitaire')
  })
})

test.describe('P8 — Ambiance', () => {
  test('/dashboard/ambiance gallery', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/ambiance`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/ambiance')
  })
})

test.describe('P9 — Aria', () => {
  test('/dashboard/aria hub modes', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/aria`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/aria')
  })
})

test.describe('P10 — Famille + Radar', () => {
  test('/dashboard/famille état no-family', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/famille`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/famille')
  })
  test('/dashboard/radar', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/radar`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/radar')
  })
})

test.describe('P11 — Challenges + Safety + Trust', () => {
  test('/dashboard/challenges templates', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/challenges`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/challenges')
  })
  test('/dashboard/safety form signalement', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/safety`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/safety')
  })
  test('/api/trust state', async ({ page }) => {
    await loginIfNeeded(page)
    const r = await page.request.get(`${BASE}/api/trust`)
    expect(r.status()).toBe(200)
    const data = await r.json()
    expect(data.state).toBeDefined()
    expect(data.state.score).toBeGreaterThanOrEqual(0)
    expect(data.state.score).toBeLessThanOrEqual(100)
  })
})

test.describe('P12 — Ambassadeur + Concours + Cross-promo', () => {
  test('/dashboard/ambassadeur apply form', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/ambassadeur`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/ambassadeur')
  })
  test('/dashboard/classement leaderboard', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/classement`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/classement')
  })
  test('/dashboard/concours résultats', async ({ page }) => {
    await loginIfNeeded(page)
    await page.goto(`${BASE}/dashboard/concours`, { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/dashboard/concours')
  })
  test('/api/challenges/catalog publique → 6 templates', async ({ request }) => {
    const r = await request.get(`${BASE}/api/challenges/catalog`)
    expect(r.status()).toBe(200)
    const data = await r.json()
    expect(Array.isArray(data.templates)).toBe(true)
    expect(data.templates.length).toBeGreaterThanOrEqual(6)
  })
  test('/go/[slug] redirect /signup avec cookie', async ({ request }) => {
    const r = await request.get(`${BASE}/go/uat-test-slug`, { maxRedirects: 0 })
    expect(r.status()).toBe(302)
    const loc = r.headers()['location'] ?? ''
    expect(loc).toContain('/signup')
    expect(loc).toContain('ref=uat-test-slug')
  })
  test('/api/cross-promo retourne max 2 promos', async ({ page }) => {
    await loginIfNeeded(page)
    const r = await page.request.get(`${BASE}/api/cross-promo`)
    expect(r.status()).toBe(200)
    const data = await r.json()
    expect(Array.isArray(data.promos)).toBe(true)
    expect(data.promos.length).toBeLessThanOrEqual(2)
  })
})

test.describe('P13 — Admin', () => {
  test('/admin redirect dashboard si pas super-admin', async ({ page }) => {
    await loginIfNeeded(page)
    const r = await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
    // user UAT n'est pas super-admin → redirect /dashboard
    expect(page.url()).toContain('/dashboard')
    // status: page.goto retourne le response final (200 dashboard)
    expect(r?.status() ?? 0).toBeLessThan(400)
  })
})
