/**
 * Matching missions humanitaires × profil user — score 0-100.
 *
 * Signaux pondérés :
 * - cause vs intérêts user (35 pts) : intersection situations × cause
 * - destination accessible (20 pts) : ville_principale = destination → +20 ; même région → +12 ; FR → +6
 * - âge requis (15 pts) : age >= required_age_min
 * - timing (15 pts) : starts_at >= now → ok, prochain mois → +15, prochain trimestre → +10
 * - spots restants (15 pts) : > 50% → +15, > 20% → +10, > 0 → +5
 */

export type HumanitarianMission = {
  id: string
  slug: string
  title: string
  ngo_name: string
  ngo_url?: string | null
  cause: string // 'climat' | 'social' | 'education' | 'sante' | 'biodiversite' | 'urgence'
  destination_city: string | null
  destination_country: string
  description: string
  duration_days: number | null
  starts_at: string | null
  ends_at?: string | null
  spots_total: number
  spots_taken: number
  cost_eur: number
  transport_discount_pct: number
  required_age_min: number | null
  prerequisites?: string | null
  contact_email?: string | null
}

export type HumanitarianProfile = {
  age?: number | null
  ville_principale?: string | null
  region?: string | null
  situations?: string[]
}

export type HumanitarianMatch = {
  mission: HumanitarianMission
  score: number
  reasons: string[]
  spots_left: number
}

const SITUATION_TO_CAUSE: Record<string, string[]> = {
  etudiant: ['education', 'climat', 'biodiversite'],
  beneficiaire_rsa: ['social', 'urgence'],
  jeune_18_25: ['education', 'climat', 'biodiversite', 'social'],
  senior: ['social', 'education', 'sante'],
  handicap: ['social', 'sante'],
  precarite: ['social', 'urgence'],
  chercheur_emploi: ['social', 'education'],
}

export function scoreMissionForProfile(
  mission: HumanitarianMission,
  profile: HumanitarianProfile,
): HumanitarianMatch {
  const reasons: string[] = []
  let score = 0

  // 1. Cause vs intérêts (35)
  const userCauses = new Set<string>()
  for (const sit of profile.situations ?? []) {
    for (const c of SITUATION_TO_CAUSE[sit] ?? []) userCauses.add(c)
  }
  if (userCauses.has(mission.cause)) {
    score += 35
    reasons.push(`Cause "${mission.cause}" alignée avec ton profil`)
  } else if (userCauses.size === 0) {
    score += 18 // user neutre → on n'exclut pas
  }

  // 2. Accessibilité géographique (20)
  if (profile.ville_principale && mission.destination_city &&
      profile.ville_principale.toLowerCase() === mission.destination_city.toLowerCase()) {
    score += 20
    reasons.push(`Mission dans ta ville (${mission.destination_city})`)
  } else if (mission.destination_country === 'France') {
    score += 12
    reasons.push('Mission accessible en train (France)')
  } else {
    score += 4
  }

  // 3. Âge (15)
  if (mission.required_age_min == null) {
    score += 15
  } else if (profile.age != null && profile.age >= mission.required_age_min) {
    score += 15
  } else if (profile.age == null) {
    score += 8 // âge inconnu → bénéfice du doute partiel
  }

  // 4. Timing (15)
  if (mission.starts_at) {
    const now = Date.now()
    const start = new Date(mission.starts_at).getTime()
    const diffDays = (start - now) / (1000 * 60 * 60 * 24)
    if (diffDays < 0) {
      score += 0 // déjà commencée
    } else if (diffDays <= 30) {
      score += 15
      reasons.push('Démarre dans le mois')
    } else if (diffDays <= 90) {
      score += 10
    } else {
      score += 5
    }
  } else {
    score += 12 // permanente / récurrente
    reasons.push('Mission permanente')
  }

  // 5. Disponibilité (15)
  const spotsLeft = mission.spots_total - mission.spots_taken
  const ratio = mission.spots_total > 0 ? spotsLeft / mission.spots_total : 0
  if (ratio > 0.5) {
    score += 15
    reasons.push(`${spotsLeft} places disponibles`)
  } else if (ratio > 0.2) {
    score += 10
    reasons.push(`Plus que ${spotsLeft} places`)
  } else if (spotsLeft > 0) {
    score += 5
    reasons.push(`Dernières places (${spotsLeft})`)
  }

  return {
    mission,
    score: Math.min(100, score),
    reasons: reasons.slice(0, 3),
    spots_left: spotsLeft,
  }
}

export function rankMissions(
  missions: HumanitarianMission[],
  profile: HumanitarianProfile,
): HumanitarianMatch[] {
  return missions
    .map((m) => scoreMissionForProfile(m, profile))
    .sort((a, b) => b.score - a.score)
}
