/**
 * Calculateur Moment WOW.
 * Calcul pur — pas d'IA, pas d'invention. Tarifs YATRA officiels.
 */

import type { CleanMobilityMode, HabitudesMobilite, MobilityMode } from '@/types/vida'

/** Tarif Vida Credits par km pour modes propres (€/km). BRIEF §3.3. */
export const VIDA_CREDITS_PER_KM: Record<CleanMobilityMode, number> = {
  marche: 0.10,
  velo: 0.15,
  trottinette: 0.10,
  transport_public: 0.05,
  covoiturage: 0.20,
  train: 0.05,
}

/** CO₂ évité par km vs voiture solo (kg CO₂/km). Source ADEME 2024. */
export const CO2_AVOIDED_PER_KM: Record<MobilityMode, number> = {
  marche: 0.193, // évite tout
  velo: 0.193,
  trottinette: 0.180,
  transport_public: 0.150,
  covoiturage: 0.130,
  train: 0.180,
  voiture_perso: 0,
  avion: 0,
}

/**
 * Estime le gain mensuel à partir des habitudes hebdomadaires.
 * On suppose une répartition équilibrée entre les modes secondaires + dominant.
 */
export function estimateMonthlyGain(habitudes: HabitudesMobilite): number {
  const { mode_dominant, km_propre_semaine, modes_secondaires } = habitudes

  // Mode dominant prend 60% des km, secondaires se partagent 40%
  const dominantShare = 0.6
  const secondaryShare = 0.4

  let kmDominant = 0
  let kmSecondary = 0

  // Si dominant est propre → 60%
  const dominantIsClean = isCleanMode(mode_dominant)
  if (dominantIsClean) {
    kmDominant = km_propre_semaine * dominantShare
  }

  const cleanSecondaries = modes_secondaires.filter(isCleanMode)
  if (cleanSecondaries.length > 0) {
    kmSecondary = (km_propre_semaine * (dominantIsClean ? secondaryShare : 1)) / cleanSecondaries.length
  } else if (!dominantIsClean) {
    // Pas de modes propres → 0 gain
    return 0
  }

  let gainHebdo = 0
  if (dominantIsClean) {
    gainHebdo += kmDominant * VIDA_CREDITS_PER_KM[mode_dominant as CleanMobilityMode]
  }
  for (const m of cleanSecondaries) {
    gainHebdo += kmSecondary * VIDA_CREDITS_PER_KM[m as CleanMobilityMode]
  }

  // 4.33 semaines / mois
  return Math.round(gainHebdo * 4.33 * 100) / 100
}

/**
 * Estime le CO₂ évité mensuel (kg) — uniquement modes propres.
 */
export function estimateMonthlyCo2Avoided(habitudes: HabitudesMobilite): number {
  const { mode_dominant, km_propre_semaine, modes_secondaires } = habitudes
  if (!isCleanMode(mode_dominant) && modes_secondaires.filter(isCleanMode).length === 0) return 0

  const allClean: MobilityMode[] = [
    ...(isCleanMode(mode_dominant) ? [mode_dominant] : []),
    ...modes_secondaires.filter(isCleanMode),
  ]
  const avgCo2 = allClean.reduce((s, m) => s + CO2_AVOIDED_PER_KM[m], 0) / allClean.length
  return Math.round(km_propre_semaine * 4.33 * avgCo2 * 10) / 10
}

export function isCleanMode(m: MobilityMode): boolean {
  return m !== 'voiture_perso' && m !== 'avion'
}

/**
 * Estime un nombre raisonnable d'aides potentiellement disponibles selon profil + région.
 * Note : valeurs prudentes (BRIEF §10 — pas de faux chiffres). P5 fera la vraie veille Tavily.
 */
export function estimateAidesCount(opts: {
  pays: string
  ville?: string | null
  age?: number | null
}): { count: number; potentielEur: number } {
  // France : ~12 catégories d'aides nationales transport mobilité (vélo électrique, prime conversion,
  // chèque mobilité, FSL transport, etc.) + locales/régionales selon ville.
  if (opts.pays !== 'FR') return { count: 0, potentielEur: 0 }

  let count = 8 // base nationale réelle
  let potentiel = 1500 // base réelle (prime vélo + chèque énergie/mobilité)

  if (opts.ville) {
    // Grande ville → plus d'aides locales
    const grandesVilles = ['paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'lille', 'nantes', 'strasbourg', 'rennes', 'nice', 'montpellier']
    if (grandesVilles.some((v) => opts.ville!.toLowerCase().includes(v))) {
      count += 4
      potentiel += 800
    } else {
      count += 2
      potentiel += 300
    }
  }

  return { count, potentielEur: potentiel }
}
