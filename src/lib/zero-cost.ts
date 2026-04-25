/**
 * Moteur Zéro-Coût : combinator multi-modal.
 * Pour un trajet (from, to), produit 3-5 combinaisons triées par 3 critères :
 * - cheapest : coût utilisateur minimal
 * - cleanest : CO₂ évité maximal
 * - apaisant : score apaisement maximal (calme + nature)
 *
 * Décisions :
 * - Modes courts (<2 km) : marche prioritaire
 * - Modes moyens (2-15 km) : vélo prioritaire (gain max 0.15€/km)
 * - Modes longs (>15 km) : train + transport public + covoiturage
 * - Voiture solo : toujours présentée comme fallback (coût + CO₂ visibles)
 */

import { getRoute, haversineKm, type Coord } from '@/lib/routing'
import { COST_PER_KM_EUR, type RouteCombination } from '@/types/trip'
import type { MobilityMode } from '@/types/vida'
import { VIDA_CREDITS_PER_KM, CO2_AVOIDED_PER_KM, isCleanMode } from '@/lib/wow'

/** Score apaisement 0-10 par mode (subjectif but cohérent). */
const APAISEMENT_SCORE: Record<MobilityMode, number> = {
  marche: 10,
  velo: 9,
  trottinette: 6,
  transport_public: 5,
  covoiturage: 5,
  train: 8,
  voiture_perso: 3,
  avion: 2,
}

type Strategy = {
  id: string
  label: string
  steps: { mode: MobilityMode; ratio: number }[]
}

/** Stratégies candidates suivant la distance. */
function buildStrategies(distanceKmHaversine: number): Strategy[] {
  const out: Strategy[] = []

  if (distanceKmHaversine <= 2.5) {
    out.push({ id: 'walk-only', label: 'Marche complète', steps: [{ mode: 'marche', ratio: 1 }] })
    out.push({ id: 'bike-only', label: 'Vélo complet', steps: [{ mode: 'velo', ratio: 1 }] })
  } else if (distanceKmHaversine <= 15) {
    out.push({ id: 'bike-only', label: 'Vélo complet', steps: [{ mode: 'velo', ratio: 1 }] })
    out.push({
      id: 'walk-pt-walk',
      label: 'Marche + transport + marche',
      steps: [
        { mode: 'marche', ratio: 0.1 },
        { mode: 'transport_public', ratio: 0.8 },
        { mode: 'marche', ratio: 0.1 },
      ],
    })
    out.push({ id: 'scoot-only', label: 'Trottinette', steps: [{ mode: 'trottinette', ratio: 1 }] })
  } else if (distanceKmHaversine <= 60) {
    out.push({ id: 'pt-only', label: 'Transports en commun', steps: [{ mode: 'transport_public', ratio: 1 }] })
    out.push({
      id: 'walk-train-walk',
      label: 'Marche + train',
      steps: [
        { mode: 'marche', ratio: 0.05 },
        { mode: 'train', ratio: 0.9 },
        { mode: 'marche', ratio: 0.05 },
      ],
    })
    out.push({ id: 'carpool', label: 'Covoiturage', steps: [{ mode: 'covoiturage', ratio: 1 }] })
  } else {
    out.push({
      id: 'walk-train-walk',
      label: 'Marche + train',
      steps: [
        { mode: 'marche', ratio: 0.03 },
        { mode: 'train', ratio: 0.94 },
        { mode: 'marche', ratio: 0.03 },
      ],
    })
    out.push({ id: 'carpool', label: 'Covoiturage longue distance', steps: [{ mode: 'covoiturage', ratio: 1 }] })
  }

  // Voiture solo en bas de classement (pour comparaison)
  out.push({ id: 'car-solo', label: 'Voiture seul', steps: [{ mode: 'voiture_perso', ratio: 1 }] })

  return out
}

/**
 * Construit une combinaison à partir d'une stratégie + distance routière de référence.
 */
function buildCombination(
  strategy: Strategy,
  totalDistanceKm: number,
  totalDurationMin: number,
): RouteCombination {
  const steps = strategy.steps.map((s) => {
    const distance_km = Math.round(s.ratio * totalDistanceKm * 100) / 100
    const duration_min = Math.round(s.ratio * totalDurationMin * 10) / 10
    const cost_eur = Math.round(distance_km * COST_PER_KM_EUR[s.mode] * 100) / 100
    return { mode: s.mode, distance_km, duration_min, cost_eur }
  })

  const distance_km = Math.round(steps.reduce((s, x) => s + x.distance_km, 0) * 100) / 100
  const duration_min = Math.round(steps.reduce((s, x) => s + x.duration_min, 0) * 10) / 10
  const cost_eur = Math.round(steps.reduce((s, x) => s + x.cost_eur, 0) * 100) / 100

  // Gain Vida Credits = somme(km*tarif) sur étapes propres
  const gain_credits_eur =
    Math.round(
      steps
        .filter((s) => isCleanMode(s.mode))
        .reduce((s, x) => s + x.distance_km * VIDA_CREDITS_PER_KM[x.mode as keyof typeof VIDA_CREDITS_PER_KM], 0) *
        100,
    ) / 100

  // CO₂ évité = somme(km*co2_avoided) sur étapes propres ; voiture/avion = 0
  const co2_avoided_kg =
    Math.round(
      steps.reduce((s, x) => s + x.distance_km * CO2_AVOIDED_PER_KM[x.mode], 0) * 100,
    ) / 100

  // Apaisement = moyenne pondérée par km
  const totalKm = steps.reduce((s, x) => s + x.distance_km, 0) || 1
  const apaisement_score =
    Math.round(
      (steps.reduce((s, x) => s + APAISEMENT_SCORE[x.mode] * x.distance_km, 0) / totalKm) * 10,
    ) / 10

  // Mode dominant = celui avec le plus de km
  const dominantStep = [...steps].sort((a, b) => b.distance_km - a.distance_km)[0]
  const mode_dominant = dominantStep?.mode ?? 'marche'

  return {
    id: strategy.id,
    label: strategy.label,
    mode_dominant,
    steps,
    distance_km,
    duration_min,
    cost_eur,
    co2_avoided_kg,
    gain_credits_eur,
    apaisement_score,
    tags: [],
  }
}

/**
 * Calcule N combinaisons multi-modales. Utilise OSRM/Mapbox seulement pour le mode driving
 * (référence métrique distance/durée), puis dérive les autres modes par approximation
 * cohérente avec la stratégie. Pour précision parfaite, on peut appeler getRoute par mode
 * mais c'est plus coûteux ; l'approximation ratio est acceptable pour l'aperçu utilisateur
 * tant qu'on ne taggue pas la route comme calculée précisément.
 */
export async function computeCombinations(from: Coord, to: Coord): Promise<RouteCombination[]> {
  const haversine = haversineKm(from, to)
  // référence routière (driving) — la plus disponible et la plus représentative
  const base = await getRoute(from, to, 'voiture_perso').catch(() => null)
  const distanceKm = base?.distance_km ?? Math.round(haversine * 1.25 * 100) / 100
  // pour la durée par mode, on prend distance_km mais avec vitesse propre au mode
  const speedByMode: Record<MobilityMode, number> = {
    marche: 5,
    velo: 16,
    trottinette: 18,
    transport_public: 22,
    covoiturage: 60,
    train: 100,
    voiture_perso: 50,
    avion: 600,
  }

  const strategies = buildStrategies(haversine)
  const combos = strategies.map((s) => {
    // durée = somme(km_step / vitesse_mode * 60)
    const totalDurationMin = s.steps.reduce(
      (acc, step) => acc + (step.ratio * distanceKm) / speedByMode[step.mode] * 60,
      0,
    )
    return buildCombination(s, distanceKm, Math.round(totalDurationMin * 10) / 10)
  })

  // Tagger les meilleurs sur chaque dimension
  if (combos.length > 0) {
    const cheapest = [...combos].sort((a, b) => a.cost_eur - b.cost_eur)[0]
    const cleanest = [...combos].sort((a, b) => b.co2_avoided_kg - a.co2_avoided_kg)[0]
    const apaisant = [...combos].sort((a, b) => b.apaisement_score - a.apaisement_score)[0]
    const fastest = [...combos].sort((a, b) => a.duration_min - b.duration_min)[0]
    cheapest.tags.push('cheapest')
    if (cleanest.id !== cheapest.id) cleanest.tags.push('cleanest')
    else cleanest.tags.push('cleanest')
    if (apaisant.id !== cheapest.id && apaisant.id !== cleanest.id) apaisant.tags.push('apaisant')
    else apaisant.tags.push('apaisant')
    fastest.tags.push('fastest')
  }

  return combos
}
