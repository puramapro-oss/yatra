/**
 * Configuration mobilité V3 — tarifs + plafonds paliers dynamiques depuis DB.
 * Remplace les constantes en dur VIDA_CREDITS_PER_KM (wow.ts reste pour compat legacy).
 */

import { createServiceClient } from '@/lib/supabase/server'
import type { CleanMobilityMode } from '@/types/vida'

export type MobilityRate = {
  mode: CleanMobilityMode
  credits_per_km: number
  co2_avoided_per_km: number
  daily_cap_base_eur: number
  monthly_cap_base_eur: number
}

export type CapCheckResult = {
  capped: boolean
  remaining_eur: number
  cap_reason?: string
}

// Cache serveur 5 min (évite requête DB chaque trip)
let ratesCache: { data: MobilityRate[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Récupère les tarifs depuis mobility_rate_config (cache 5 min).
 */
export async function getMobilityRates(): Promise<MobilityRate[]> {
  const now = Date.now()
  if (ratesCache && now - ratesCache.fetchedAt < CACHE_TTL_MS) {
    return ratesCache.data
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('mobility_rate_config')
    .select('mode, credits_per_km, co2_avoided_per_km, daily_cap_base_eur, monthly_cap_base_eur')
    .order('mode')

  if (error || !data) {
    throw new Error(`Échec lecture tarifs mobilité : ${error?.message ?? 'data null'}`)
  }

  const rates = data as MobilityRate[]
  ratesCache = { data: rates, fetchedAt: now }
  return rates
}

/**
 * Retourne le tarif d'un mode spécifique.
 */
export async function getRateForMode(mode: CleanMobilityMode): Promise<MobilityRate> {
  const rates = await getMobilityRates()
  const rate = rates.find((r) => r.mode === mode)
  if (!rate) throw new Error(`Tarif introuvable pour mode ${mode}`)
  return rate
}

/**
 * Mapping plan Stripe → multiplicateur palier.
 * free → ×1, premium_monthly/annual → ×5, lifetime_anti_churn → ×10.
 * (Provisoire tant que CORE_READY=false, cf DECISIONS.md R06)
 */
export function getPlanMultiplier(stripePlan: string | null | undefined): number {
  if (!stripePlan || stripePlan === 'free') return 1
  if (stripePlan === 'premium_monthly' || stripePlan === 'premium_annual') return 5
  if (stripePlan === 'lifetime_anti_churn') return 10
  return 1 // fallback safe
}

/**
 * Plafond journalier selon plan user.
 */
export function getUserDailyLimit(baseCap: number, stripePlan: string | null | undefined): number {
  return baseCap * getPlanMultiplier(stripePlan)
}

/**
 * Plafond mensuel selon plan user.
 */
export function getUserMonthlyLimit(baseCap: number, stripePlan: string | null | undefined): number {
  return baseCap * getPlanMultiplier(stripePlan)
}

/**
 * Vérifie si un gain potentiel dépasse le plafond journalier.
 * Retourne remaining_eur disponible (avant écrêtage).
 */
export async function checkDailyCap(
  userId: string,
  potentialGain: number,
  dailyCapUser: number,
): Promise<CapCheckResult> {
  const supabase = createServiceClient()

  // Sum gains trip_clean aujourd'hui
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('source', 'trip_clean')
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59.999Z`)

  if (error) throw new Error(`Erreur lecture gains journaliers : ${error.message}`)

  const earnedToday = (data ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0)
  const remaining = Math.max(0, dailyCapUser - earnedToday)

  if (potentialGain > remaining) {
    return {
      capped: true,
      remaining_eur: remaining,
      cap_reason: `Plafond journalier atteint (${dailyCapUser.toFixed(2)} €/jour). Gain écrêté.`,
    }
  }

  return { capped: false, remaining_eur: remaining }
}

/**
 * Vérifie si un gain potentiel dépasse le plafond mensuel.
 */
export async function checkMonthlyCap(
  userId: string,
  potentialGain: number,
  monthlyCapUser: number,
): Promise<CapCheckResult> {
  const supabase = createServiceClient()

  // Sum gains trip_clean ce mois-ci
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('source', 'trip_clean')
    .gte('created_at', firstDay)
    .lte('created_at', lastDay)

  if (error) throw new Error(`Erreur lecture gains mensuels : ${error.message}`)

  const earnedMonth = (data ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0)
  const remaining = Math.max(0, monthlyCapUser - earnedMonth)

  if (potentialGain > remaining) {
    return {
      capped: true,
      remaining_eur: remaining,
      cap_reason: `Plafond mensuel atteint (${monthlyCapUser.toFixed(2)} €/mois). Gain écrêté.`,
    }
  }

  return { capped: false, remaining_eur: remaining }
}
