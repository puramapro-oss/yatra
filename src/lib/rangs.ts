/**
 * Rangs YATRA — 4 paliers progression collective avec multiplicateurs et avantages.
 *
 * Score d'Humanité 0-10 → rang :
 *  - <3   Explorateur 🌱 (×1)
 *  - 3-5  Gardien 🛡️ (×1.2)
 *  - 5-8  Régénérateur 🌳 (×1.5)
 *  - >=8  Légende ⭐ (×2)
 *
 * Le multiplicateur s'applique sur les gains Vida Credits (trajets propres) en plus du multiplicateur ancienneté.
 * Composition : gain_final = gain_base × multi_anciennete × multi_rang.
 */

import type { RangIdentity } from '@/types/vida'

export const RANG_MULTIPLIERS: Record<RangIdentity, number> = {
  explorateur: 1.0,
  gardien: 1.2,
  regenerateur: 1.5,
  legende: 2.0,
}

export function rangMultiplier(rang: RangIdentity | null | undefined): number {
  if (!rang) return 1.0
  return RANG_MULTIPLIERS[rang] ?? 1.0
}

export type RangAvantages = {
  multiplier_label: string
  cash_threshold_eur: number  // seuil retrait wallet sans validation additionnelle
  challenge_max_stake_eur: number
  features: string[]
}

export const RANG_AVANTAGES: Record<RangIdentity, RangAvantages> = {
  explorateur: {
    multiplier_label: '×1.0',
    cash_threshold_eur: 5,
    challenge_max_stake_eur: 25,
    features: [
      'Crédits Vida sur trajets propres',
      'Radar gratuit & aides',
      'Communauté Aria · 7 modes',
      "1 challenge stake actif (max 25€)",
    ],
  },
  gardien: {
    multiplier_label: '×1.2',
    cash_threshold_eur: 5,
    challenge_max_stake_eur: 50,
    features: [
      'Multiplicateur ×1.2 sur trajets propres',
      'Cashback partenaires éthiques',
      'Voyages humanitaires VIDA Assoc',
      "Challenge stake jusqu'à 50€",
    ],
  },
  regenerateur: {
    multiplier_label: '×1.5',
    cash_threshold_eur: 5,
    challenge_max_stake_eur: 100,
    features: [
      'Multiplicateur ×1.5 sur trajets propres',
      'Famille jusqu\'à 6 membres',
      'Modes Ambiance binauraux',
      'Challenge stake jusqu\'à 100€',
      'Priorité aides Tavily',
    ],
  },
  legende: {
    multiplier_label: '×2.0',
    cash_threshold_eur: 5,
    challenge_max_stake_eur: 200,
    features: [
      'Multiplicateur ×2 sur trajets propres',
      'Accès Beta nouvelles features',
      'Challenge stake jusqu\'à 200€',
      'Influence communautaire — vote signalements crédibilité',
      'Mention spéciale dashboard Légendes',
    ],
  },
}

/**
 * Score nécessaire pour atteindre le rang suivant.
 */
export function nextRang(rang: RangIdentity): { next: RangIdentity | null; thresholdScore: number | null } {
  switch (rang) {
    case 'explorateur':
      return { next: 'gardien', thresholdScore: 3 }
    case 'gardien':
      return { next: 'regenerateur', thresholdScore: 5.5 }
    case 'regenerateur':
      return { next: 'legende', thresholdScore: 8 }
    case 'legende':
      return { next: null, thresholdScore: null }
  }
}
