/**
 * UAT helpers — création user de test via Supabase admin + helpers communs.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.UAT_SUPABASE_URL ?? 'https://auth.purama.dev'
const SERVICE_KEY = process.env.UAT_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.UAT_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SERVICE_KEY) {
  throw new Error('UAT_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY manquante. Lancer avec env.')
}
if (!ANON_KEY) {
  throw new Error('UAT_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY manquante.')
}

export const SCHEMA = 'yatra'

export const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: SCHEMA },
})

export type TestUser = {
  id: string
  email: string
  password: string
}

export async function createTestUser(): Promise<TestUser> {
  const ts = Date.now()
  const email = `uat-${ts}-${Math.floor(Math.random() * 9999)}@yatra-uat.purama.test`
  const password = `Uat${ts}!Secure`
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'UAT User', uat: true },
  })
  if (error || !data.user) {
    throw new Error(`createUser fail: ${error?.message}`)
  }
  // Attendre quelques ms le trigger handle_new_auth_user (création profile/wallet)
  await new Promise((r) => setTimeout(r, 800))
  return { id: data.user.id, email, password }
}

export async function deleteTestUser(userId: string) {
  await adminSupabase.auth.admin.deleteUser(userId).catch(() => null)
}

/** Connecte le user dans le contexte Playwright (cookies SSR Supabase). */
export async function loginViaUI(page: import('@playwright/test').Page, baseURL: string, user: TestUser) {
  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
}

/** Génère trace GPS vélo réaliste (Paris, ~5 km à 18 km/h ≈ 17 min). */
export function generateBikeGps(opts: {
  startLat?: number
  startLon?: number
  durationSec?: number
  speedKmh?: number
  startTime?: number
} = {}) {
  const startLat = opts.startLat ?? 48.8566
  const startLon = opts.startLon ?? 2.3522
  const duration = opts.durationSec ?? 1020 // 17 min
  const speed = opts.speedKmh ?? 18
  const startTime = opts.startTime ?? Date.now() - duration * 1000
  const points: Array<{ lat: number; lon: number; accuracy: number; t: number; speed: number | null; heading: number | null; altitude: number | null }> = []

  // Avance vers le NE (heading 45°)
  const headingRad = (45 * Math.PI) / 180
  const stepSec = 5 // un point toutes les 5s
  const speedMs = speed / 3.6
  for (let i = 0; i <= duration; i += stepSec) {
    const dist_m = speedMs * i
    // delta lat/lon approximé pour Paris (1° lat ≈ 111111 m, 1° lon ≈ 73000 m à 48°)
    const dLat = (dist_m * Math.cos(headingRad)) / 111111
    const dLon = (dist_m * Math.sin(headingRad)) / 73000
    points.push({
      lat: startLat + dLat,
      lon: startLon + dLon,
      accuracy: 6 + Math.random() * 4,
      t: startTime + i * 1000,
      speed: speedMs,
      heading: 45,
      altitude: null,
    })
  }
  return points
}

/** Génère trace GPS voiture rapide pour test anti-fraude (suspecte). */
export function generateCarGps(opts: { speedKmh?: number; durationSec?: number } = {}) {
  const speed = opts.speedKmh ?? 95
  const duration = opts.durationSec ?? 600
  return generateBikeGps({ speedKmh: speed, durationSec: duration })
}
