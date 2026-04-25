/**
 * Matching aides × profil utilisateur — score de pertinence 0-100.
 * Calcul pur (pas d'IA, déterministe, explicable). Utilisé par l'API et le CRON.
 *
 * Signaux pondérés :
 * - region (24 pts) : FR national = 12 pts ; région exacte = 24 pts ; autre région = 0
 * - situation (28 pts) : intersection situation_user × situation_eligible (max 2 matches)
 * - transport (24 pts) : intersection mode_dominant + secondaires × transport_modes_eligible
 * - âge (12 pts) : age_min ≤ user.age ≤ age_max (si l'aide spécifie)
 * - profil_eligible (12 pts) : adulte/jeune_adulte
 *
 * Total max théorique = 100. On normalise.
 */

import type { MobilityMode } from '@/types/vida'

export type MatchProfile = {
  pays: string // 'FR' généralement
  region?: string | null // 'IDF', 'AURA', 'OCC', 'FR', etc.
  age?: number | null
  situations: string[] // ['etudiant', 'beneficiaire_rsa', etc.]
  transport_modes: MobilityMode[]
}

export type Aide = {
  id: string
  slug: string | null
  nom: string
  category: string | null
  region: string | null
  situation_eligible: string[] | null
  transport_modes_eligible: string[] | null
  profil_eligible: string[] | null
  age_min: number | null
  age_max: number | null
  handicap_only: boolean | null
  active: boolean
}

export type MatchResult = {
  aide_id: string
  score: number
  reasons: string[]
}

/** Détermine la tranche d'âge label. */
function ageBucket(age: number | null | undefined): string | null {
  if (age == null) return null
  if (age < 18) return 'mineur'
  if (age < 30) return 'jeune_adulte'
  if (age < 65) return 'adulte'
  return 'senior'
}

export function scoreAideForProfile(aide: Aide, profile: MatchProfile): MatchResult {
  if (!aide.active) return { aide_id: aide.id, score: 0, reasons: [] }

  let score = 0
  const reasons: string[] = []

  // 1. Région (max 24)
  if (aide.region === profile.region) {
    score += 24
    reasons.push(`Disponible dans ta région (${profile.region})`)
  } else if (aide.region === 'FR' || aide.region === profile.pays) {
    score += 12
    reasons.push('Nationale (toute la France)')
  }

  // 2. Handicap (filtre éliminatoire)
  if (aide.handicap_only && !profile.situations.some((s) => s.includes('handicap') || s === 'beneficiaire_aah' || s === 'rqth')) {
    return { aide_id: aide.id, score: 0, reasons: ['Réservée handicap'] }
  }

  // 3. Situation match (max 28, +14 par situation matchée, plafonné à 28)
  const eligibleSituations = aide.situation_eligible ?? []
  let situationMatches = 0
  for (const s of profile.situations) {
    if (eligibleSituations.includes(s)) {
      situationMatches += 1
      if (situationMatches <= 2) {
        score += 14
        reasons.push(`Pour ${labelSituation(s)}`)
      }
    }
  }
  // Si l'aide n'a pas de situation_eligible (ou vide), on donne 14 par défaut (= ouverte à tous)
  if (eligibleSituations.length === 0) {
    score += 14
    reasons.push('Ouverte à toutes situations')
  }

  // 4. Transport modes (max 24, +12 par mode matché, plafonné à 24)
  const eligibleTransport = aide.transport_modes_eligible ?? []
  let transportMatches = 0
  for (const m of profile.transport_modes) {
    if (eligibleTransport.includes(m)) {
      transportMatches += 1
      if (transportMatches <= 2) {
        score += 12
        reasons.push(`Compatible ${labelTransport(m)}`)
      }
    }
  }
  // Si pas de transport_modes_eligible : aide non transport (énergie/social) → +6 si catégorie pertinente
  if (eligibleTransport.length === 0 && (aide.category === 'social' || aide.category === 'energie' || aide.category === 'logement')) {
    score += 6
    reasons.push('Soutien indirect aux trajets')
  }

  // 5. Âge (max 12)
  const userAge = profile.age ?? null
  if (userAge !== null && (aide.age_min !== null || aide.age_max !== null)) {
    const ageOk = (aide.age_min == null || userAge >= aide.age_min) && (aide.age_max == null || userAge <= aide.age_max)
    if (ageOk) {
      score += 12
      reasons.push(`Tu as l'âge requis (${userAge} ans)`)
    } else {
      // hors tranche → pénalité forte
      score = Math.max(0, score - 30)
    }
  }

  // 6. Profil_eligible (max 12) — bucket d'âge
  const userBucket = ageBucket(userAge)
  if (aide.profil_eligible && aide.profil_eligible.length > 0 && userBucket) {
    if (aide.profil_eligible.includes(userBucket)) {
      score += 12
      reasons.push(`Profil ${userBucket} éligible`)
    }
  } else {
    score += 6 // pas de spec → on bénéficie du doute
  }

  // Normalisation 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))
  return { aide_id: aide.id, score, reasons }
}

export function rankAidesForProfile(aides: Aide[], profile: MatchProfile): MatchResult[] {
  return aides
    .map((a) => scoreAideForProfile(a, profile))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}

function labelSituation(s: string): string {
  const map: Record<string, string> = {
    salarie: 'salariés',
    salarie_precaire: 'salariés précaires',
    etudiant: 'étudiants',
    demandeur_emploi: 'demandeurs d\'emploi',
    beneficiaire_rsa: 'bénéficiaires du RSA',
    beneficiaire_aah: 'bénéficiaires de l\'AAH',
    en_situation_handicap: 'personnes en situation de handicap',
    rqth: 'RQTH',
    retraite: 'retraités',
    apprenti: 'apprentis',
    jeune_actif: 'jeunes actifs',
    agent_public: 'agents publics',
    proprietaire: 'propriétaires',
  }
  return map[s] ?? s.replace(/_/g, ' ')
}

function labelTransport(m: string): string {
  const map: Record<string, string> = {
    velo: 'vélo',
    marche: 'marche',
    trottinette: 'trottinette',
    transport_public: 'transports en commun',
    covoiturage: 'covoiturage',
    train: 'train',
  }
  return map[m] ?? m
}
