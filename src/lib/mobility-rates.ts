/**
 * YATRA — Mobilité V3 — Barème dynamique (table DB `mobility_rate_config`).
 * Remplace constantes en dur `VIDA_CREDITS_PER_KM` + `CO2_AVOIDED_PER_KM` (lib/wow.ts).
 */

import { createClient } from '@/lib/supabase/server'
import type { CleanMobilityMode, MobilityMode } from '@/types/vida'

export type MobilityRate = {
  mode: CleanMobilityMode
  credits_per_km: number
  co2_avoided_per_km: number
  daily_cap_base_eur: number
  monthly_cap_base_eur: number
}

export type MobilityRatesMap = Record<CleanMobilityMode, MobilityRate>

/**
 * Fetch barème mobilité depuis DB (table `mobility_rate_config`).
 * Utilisé par API `/vida/trip/route` + `/vida/trip/end`.
 */
export async function getMobilityRates(): Promise<MobilityRatesMap> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mobility_rate_config')
    .select('mode, credits_per_km, co2_avoided_per_km, daily_cap_base_eur, monthly_cap_base_eur')
    .order('mode')

  if (error) throw new Error(`Échec fetch barème mobilité : ${error.message}`)
  if (!data || data.length === 0) {
    throw new Error('Barème mobilité vide — migration P15 non appliquée ?')
  }

  const map: Partial<MobilityRatesMap> = {}
  for (const row of data) {
    map[row.mode as CleanMobilityMode] = {
      mode: row.mode as CleanMobilityMode,
      credits_per_km: row.credits_per_km,
      co2_avoided_per_km: row.co2_avoided_per_km,
      daily_cap_base_eur: row.daily_cap_base_eur,
      monthly_cap_base_eur: row.monthly_cap_base_eur,
    }
  }

  return map as MobilityRatesMap
}

/**
 * Calcule points YATRA + CO₂ évité pour un trajet donné.
 */
export function computeTripMetrics(params: {
  mode: MobilityMode
  distanceKm: number
  rates: MobilityRatesMap
}): { pointsEur: number; co2AvoidedKg: number } {
  const { mode, distanceKm, rates } = params

  if (mode === 'voiture_perso' || mode === 'avion') {
    return { pointsEur: 0, co2AvoidedKg: 0 }
  }

  const rate = rates[mode as CleanMobilityMode]
  if (!rate) {
    return { pointsEur: 0, co2AvoidedKg: 0 }
  }

  const pointsEur = Math.round(distanceKm * rate.credits_per_km * 100) / 100
  const co2AvoidedKg = Math.round(distanceKm * rate.co2_avoided_per_km * 100) / 100

  return { pointsEur, co2AvoidedKg }
}

/**
 * Vérifie si un mode est propre (éligible aux points YATRA).
 */
export function isCleanMode(mode: MobilityMode): mode is CleanMobilityMode {
  return mode !== 'voiture_perso' && mode !== 'avion'
}
