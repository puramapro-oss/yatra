/**
 * Types VIDA CORE — partagés écosystème PURAMA.
 * Référentiel : tout ce qui définit l'identité voyage d'un utilisateur YATRA.
 */

export type MobilityMode =
  | 'marche'
  | 'velo'
  | 'trottinette'
  | 'transport_public'
  | 'covoiturage'
  | 'voiture_perso'
  | 'avion'
  | 'train'

export type CleanMobilityMode = Exclude<MobilityMode, 'voiture_perso' | 'avion'>

export const CLEAN_MODES: CleanMobilityMode[] = [
  'marche',
  'velo',
  'trottinette',
  'transport_public',
  'covoiturage',
  'train',
]

export const MOBILITY_LABELS: Record<MobilityMode, string> = {
  marche: 'Marche',
  velo: 'Vélo',
  trottinette: 'Trottinette',
  transport_public: 'Transports en commun',
  covoiturage: 'Covoiturage',
  voiture_perso: 'Voiture personnelle',
  avion: 'Avion',
  train: 'Train',
}

export const MOBILITY_EMOJI: Record<MobilityMode, string> = {
  marche: '🚶',
  velo: '🚲',
  trottinette: '🛴',
  transport_public: '🚌',
  covoiturage: '🚙',
  voiture_perso: '🚗',
  avion: '✈️',
  train: '🚆',
}

export type AmbianceMode = 'foret' | 'pluie' | 'ocean' | 'feu' | 'temple_futuriste' | 'silence_sacre'

export type RangIdentity = 'explorateur' | 'gardien' | 'regenerateur' | 'legende'

/** Habitudes mobilité hebdomadaires — saisies à l'onboarding. */
export type HabitudesMobilite = {
  /** Mode dominant utilisé en semaine */
  mode_dominant: MobilityMode
  /** km/semaine estimés en mobilité propre (marche+vélo+trottinette+transport+covoit) */
  km_propre_semaine: number
  /** km/semaine estimés en voiture perso/avion */
  km_carbone_semaine: number
  /** Modes secondaires occasionnels */
  modes_secondaires: MobilityMode[]
}

/** Préférences sensorielles — saisies à l'onboarding. */
export type PreferencesSensorielles = {
  ambiance_preferee: AmbianceMode
  binaural_enabled: boolean
  haptique_enabled: boolean
  voix_aria: 'douce' | 'energique' | 'silencieuse'
}

/** Profil onboarding complet. */
export type ProfilOnboarding = {
  full_name: string
  ville_principale: string
  pays_principal: string
  habitudes: HabitudesMobilite
  preferences: PreferencesSensorielles
  permissions: {
    location: boolean
    notifications: boolean
    motion_sensors: boolean
  }
}

/** Événement Fil de Vie — append-only. */
export type FilDeVieEventType =
  | 'signup'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'first_clean_trip'
  | 'first_credit'
  | 'first_referral'
  | 'first_aide_activated'
  | 'rang_changed'
  | 'mission_completed'
  | 'voyage_humanitaire'
  | 'first_withdrawal'
  | 'streak_milestone'
  | 'concours_top10'
  | 'tirage_winner'

export type FilDeVieEvent = {
  id: string
  user_id: string
  app_slug: string
  event_type: FilDeVieEventType
  payload: Record<string, unknown>
  irreversible: boolean
  created_at: string
}

/** Score d'Humanité — composantes pondérées. */
export type ScoreBreakdown = {
  trajets_propres: number // 0-3 pts (régularité mobilité propre)
  missions: number // 0-2 pts
  entraide: number // 0-2 pts (parrainage actif, partage)
  regularite: number // 0-1.5 pts (streak)
  anciennete: number // 0-1.5 pts (cap 12 mois)
}

/** Réponse Moment WOW — révélation onboarding. */
export type MomentWow = {
  gain_mensuel_estime_eur: number
  km_propre_semaine: number
  co2_evite_mensuel_kg: number
  aides_detectees_count: number
  aides_potentielles_eur: number
  premier_action: {
    label: string
    href: string
    estimated_time_seconds: number
  }
  villes_top: string[]
}
