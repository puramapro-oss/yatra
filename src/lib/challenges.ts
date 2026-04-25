/**
 * Challenges Stake YATRA — défis à mise en jeu €.
 * User mise X€, accomplit micro-tâches preuves quotidiennes pendant N jours,
 * succès = récup mise + récompense, échec = mise redistribuée (cagnotte communautaire P12+).
 *
 * Catalogue : 6 templates curés. Tous ancrés mobilité douce + sécurité réelle.
 * Anti-fraude :
 *  - Trust >= 30 requis (start)
 *  - 1 challenge actif max simultanément
 *  - Preuves quotidiennes uniques (UNIQUE challenge_id, day_date)
 *  - fraud_score auto sur preuve type 'trip_clean'
 */

import type { CleanMobilityMode } from '@/types/vida'

export type ChallengeTemplate = {
  slug: string
  title: string
  emoji: string
  description: string
  duration_days: 7 | 30 | 90
  proof_type: 'trip_clean' | 'photo_code' | 'gps_zone' | 'self_declared'
  proofs_required: number  // au moins X jours validés sur duration_days
  stake_min_eur: number
  stake_max_eur: number
  reward_target_eur: number  // bonus si succès
  required_modes?: CleanMobilityMode[]  // si proof_type=trip_clean
  hints: string[]
  category: 'mobilite' | 'rituel' | 'engagement'
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    slug: 'no-car-7d',
    title: 'Une semaine sans voiture',
    emoji: '🚲',
    description: '7 jours d\'affilée, au moins 1 trajet propre validé par jour. Pas un seul trajet voiture solo.',
    duration_days: 7,
    proof_type: 'trip_clean',
    proofs_required: 5,
    stake_min_eur: 10,
    stake_max_eur: 50,
    reward_target_eur: 8,
    required_modes: ['marche', 'velo', 'trottinette', 'transport_public', 'covoiturage', 'train'],
    hints: ['1 trajet ≥ 1 km/jour suffit', 'Vélo + transport public fait foi', 'Marche ≥ 1 km compte aussi'],
    category: 'mobilite',
  },
  {
    slug: 'walk-30d',
    title: '30 jours de marche',
    emoji: '🚶',
    description: '1 marche d\'au moins 1 km par jour pendant 30 jours. Marge : 5 jours OFF tolérés.',
    duration_days: 30,
    proof_type: 'trip_clean',
    proofs_required: 25,
    stake_min_eur: 15,
    stake_max_eur: 75,
    reward_target_eur: 20,
    required_modes: ['marche'],
    hints: ['Trajet domicile-bureau compte', 'Marche détente compte aussi', 'GPS auto via /trajet/active'],
    category: 'mobilite',
  },
  {
    slug: 'velo-90d',
    title: 'Vélo 90 jours',
    emoji: '🚴',
    description: 'Démarre une vraie habitude vélo. 60 jours validés sur 90 = pari réussi.',
    duration_days: 90,
    proof_type: 'trip_clean',
    proofs_required: 60,
    stake_min_eur: 30,
    stake_max_eur: 150,
    reward_target_eur: 60,
    required_modes: ['velo'],
    hints: ['Vélo perso ou Vélib/Vélo\'v', 'Rythme : 5 jours/semaine recommandé', 'Bonus cardio + impact CO₂'],
    category: 'mobilite',
  },
  {
    slug: 'transport-public-30d',
    title: 'Transport public 30 jours',
    emoji: '🚌',
    description: '1 trajet en transport public quotidien. Train, métro, bus, tram — à toi de choisir.',
    duration_days: 30,
    proof_type: 'trip_clean',
    proofs_required: 22,
    stake_min_eur: 10,
    stake_max_eur: 50,
    reward_target_eur: 15,
    required_modes: ['transport_public', 'train'],
    hints: ['Pass mensuel = ROI évident', 'Marge 8 jours OFF', 'Idéal Île-de-France / Lyon / Marseille'],
    category: 'mobilite',
  },
  {
    slug: 'gratitude-7d',
    title: '7 jours de gratitude',
    emoji: '🙏',
    description: 'Chaque jour, écris 1 chose pour laquelle tu es reconnaissant·e dans Aria · gratitude.',
    duration_days: 7,
    proof_type: 'self_declared',
    proofs_required: 7,
    stake_min_eur: 5,
    stake_max_eur: 25,
    reward_target_eur: 5,
    hints: ['Mode Aria Gratitude', '5 minutes/jour', 'Reflet du rayonnement'],
    category: 'rituel',
  },
  {
    slug: 'meditation-30d',
    title: 'Méditation 30 jours',
    emoji: '🌬️',
    description: '1 session méditation Aria ≥ 5 min par jour. 25 jours sur 30 = succès.',
    duration_days: 30,
    proof_type: 'self_declared',
    proofs_required: 25,
    stake_min_eur: 15,
    stake_max_eur: 75,
    reward_target_eur: 18,
    hints: ['Mode Aria Méditation guidée', 'Couplé Modes Ambiance binauraux', 'Cohérence cardiaque encouragée'],
    category: 'rituel',
  },
]

export function findTemplate(slug: string): ChallengeTemplate | undefined {
  return CHALLENGE_TEMPLATES.find((t) => t.slug === slug)
}

/**
 * Validation paramètres start challenge contre template.
 */
export function validateStakeParams(opts: {
  templateSlug: string
  stake_amount_eur: number
}): { valid: true; template: ChallengeTemplate } | { valid: false; error: string } {
  const tpl = findTemplate(opts.templateSlug)
  if (!tpl) return { valid: false, error: 'Template inconnu' }
  if (opts.stake_amount_eur < tpl.stake_min_eur || opts.stake_amount_eur > tpl.stake_max_eur) {
    return {
      valid: false,
      error: `Mise comprise entre ${tpl.stake_min_eur}€ et ${tpl.stake_max_eur}€ pour ce challenge`,
    }
  }
  return { valid: true, template: tpl }
}

export type ChallengeProgress = {
  proofs_done: number
  proofs_required: number
  days_remaining: number
  on_track: boolean // true si extrapolation linéaire valide la cible
}

export function computeProgress(opts: {
  proofs_done: number
  proofs_required: number
  start_date: string
  end_date: string
}): ChallengeProgress {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(opts.start_date)
  const end = new Date(opts.end_date)
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = today.getTime() - start.getTime()
  const elapsedDays = Math.max(0, Math.round(elapsedMs / 86400000))
  const totalDays = Math.max(1, Math.round(totalMs / 86400000) + 1)
  const remaining = Math.max(0, totalDays - elapsedDays - 1)

  const expectedSoFar = elapsedDays > 0 ? Math.ceil((opts.proofs_required * elapsedDays) / totalDays) : 0
  const onTrack = opts.proofs_done >= expectedSoFar

  return {
    proofs_done: opts.proofs_done,
    proofs_required: opts.proofs_required,
    days_remaining: remaining,
    on_track: onTrack,
  }
}
