/**
 * Score d'Humanité YATRA — composante centrale du système de redistribution (BRIEF §6).
 * Score 0-10 = pondération de 5 axes : trajets propres, missions, entraide, régularité, ancienneté.
 * Cap absolu ancienneté à 12 mois (BRIEF §3.3).
 */

import type { ScoreBreakdown } from '@/types/vida'
import { ANCIENNETE_CAP_MONTHS } from '@/lib/constants'

export type ScoreInputs = {
  trajets_propres_30j: number // nombre de trajets propres validés sur 30 derniers jours
  missions_done_30j: number // missions humanitaires/locales validées 30j
  parrainages_actifs: number // filleuls toujours abonnés
  partages_30j: number // partages story/parrainage 30j
  streak_days: number // jours consécutifs d'activité
  anciennete_months: number // capped 12 max via fonction
}

export function computeScoreHumanite(inputs: ScoreInputs): { total: number; breakdown: ScoreBreakdown } {
  // Trajets propres (max 3 pts) — saturate à 30 trajets/mois
  const trajets_propres = Math.min(3, (inputs.trajets_propres_30j / 30) * 3)

  // Missions (max 2 pts) — saturate à 5 missions/mois
  const missions = Math.min(2, (inputs.missions_done_30j / 5) * 2)

  // Entraide (max 2 pts) — parrainages comptent double
  const entraidePts = inputs.parrainages_actifs * 0.4 + inputs.partages_30j * 0.1
  const entraide = Math.min(2, entraidePts)

  // Régularité (max 1.5 pts) — streak 30 jours = max
  const regularite = Math.min(1.5, (inputs.streak_days / 30) * 1.5)

  // Ancienneté (max 1.5 pts) — cap 12 mois
  const ancMonths = Math.min(ANCIENNETE_CAP_MONTHS, Math.max(0, inputs.anciennete_months))
  const anciennete = (ancMonths / ANCIENNETE_CAP_MONTHS) * 1.5

  const totalRaw = trajets_propres + missions + entraide + regularite + anciennete
  const total = Math.round(totalRaw * 100) / 100

  return {
    total,
    breakdown: {
      trajets_propres: round2(trajets_propres),
      missions: round2(missions),
      entraide: round2(entraide),
      regularite: round2(regularite),
      anciennete: round2(anciennete),
    },
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function rangFromScore(score: number): 'explorateur' | 'gardien' | 'regenerateur' | 'legende' {
  if (score >= 8) return 'legende'
  if (score >= 5.5) return 'regenerateur'
  if (score >= 3) return 'gardien'
  return 'explorateur'
}

export const RANG_LABELS: Record<'explorateur' | 'gardien' | 'regenerateur' | 'legende', string> = {
  explorateur: 'Explorateur',
  gardien: 'Gardien',
  regenerateur: 'Régénérateur',
  legende: 'Légende',
}

export const RANG_EMOJI: Record<'explorateur' | 'gardien' | 'regenerateur' | 'legende', string> = {
  explorateur: '🌱',
  gardien: '🛡️',
  regenerateur: '🌳',
  legende: '⭐',
}
