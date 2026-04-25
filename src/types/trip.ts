/**
 * Types Trajets YATRA.
 * Tout ce qui touche au moteur Zéro-Coût + GPS + anti-fraude.
 */

import type { CleanMobilityMode, MobilityMode } from './vida'

/** Statut d'un trajet. */
export type TripStatus = 'active' | 'completed' | 'discarded' | 'flagged'

/** Point GPS capturé par navigator.geolocation. */
export type GpsPoint = {
  lat: number
  lon: number
  /** Précision en mètres (depuis HTML5 Geolocation API). */
  accuracy: number
  /** Timestamp ms epoch. */
  t: number
  /** Vitesse instantanée en m/s (si fournie par le device). */
  speed?: number | null
  /** Heading en degrés (0-360, si fourni). */
  heading?: number | null
  /** Altitude en mètres (si fournie). */
  altitude?: number | null
}

/** Géométrie polyline (suite de [lon, lat]) — encodage GeoJSON. */
export type RouteGeometry = {
  type: 'LineString'
  coordinates: [number, number][]
}

/** Une suggestion de combinaison multi-modal. */
export type RouteCombination = {
  /** Identifiant stable pour clé React. */
  id: string
  /** Étiquette humaine. Ex: "Vélo entièrement", "Marche + train". */
  label: string
  /** Mode dominant pour le scoring. */
  mode_dominant: MobilityMode
  /** Étapes ordonnées. */
  steps: Array<{
    mode: MobilityMode
    distance_km: number
    duration_min: number
    cost_eur: number
  }>
  /** Distance totale en km. */
  distance_km: number
  /** Durée totale en minutes. */
  duration_min: number
  /** Coût total en € (transport public, vélo libre service, etc.). */
  cost_eur: number
  /** CO₂ évité vs voiture solo en kg. */
  co2_avoided_kg: number
  /** Gain potentiel YATRA en € (Vida Credits). */
  gain_credits_eur: number
  /** Score apaisement 0-10 (qualité du trajet). */
  apaisement_score: number
  /** Tags pour le ranking : "cheapest", "cleanest", "apaisant". */
  tags: ('cheapest' | 'cleanest' | 'apaisant' | 'fastest')[]
}

/** Résultat anti-fraude pour un trajet terminé. */
export type AntiFraudResult = {
  /** Mode détecté à partir des points GPS. */
  detected_mode: MobilityMode
  /** Mode déclaré par l'utilisateur. */
  declared_mode: MobilityMode
  /** Confiance détection 0-100. */
  confidence: number
  /** Score de fraude 0-100 (0 = clean, 100 = très suspect). */
  fraud_score: number
  /** Raisons concrètes de suspicion (si fraud_score > 0). */
  reasons: string[]
  /** Vitesse moyenne km/h. */
  avg_speed_kmh: number
  /** Vitesse max km/h. */
  max_speed_kmh: number
  /** Distance recalculée Haversine en km. */
  distance_km: number
}

/** Représentation d'un trajet complet. */
export type Trip = {
  id: string
  user_id: string
  status: TripStatus
  declared_mode: MobilityMode
  detected_mode: MobilityMode | null
  distance_km: number
  duration_min: number
  gain_credits_eur: number
  co2_avoided_kg: number
  fraud_score: number
  from_label: string | null
  to_label: string | null
  geometry: RouteGeometry | null
  started_at: string
  ended_at: string | null
}

/** Forme reçue depuis Nominatim. */
export type GeocodeResult = {
  label: string
  lat: number
  lon: number
}

/** Profil OSRM. */
export type OsrmProfile = 'walking' | 'cycling' | 'driving'

export const MODE_TO_OSRM: Record<MobilityMode, OsrmProfile> = {
  marche: 'walking',
  velo: 'cycling',
  trottinette: 'cycling', // OSRM ne distingue pas, vélo proche
  transport_public: 'driving', // approx routier (P6 partenaires GTFS)
  covoiturage: 'driving',
  voiture_perso: 'driving',
  avion: 'driving',
  train: 'driving',
}

/** Tarif moyen en €/km pour le coût utilisateur (≠ Vida Credits qui est ce qu'il GAGNE). */
export const COST_PER_KM_EUR: Record<MobilityMode, number> = {
  marche: 0,
  velo: 0,
  trottinette: 0.20, // libre-service
  transport_public: 0.10, // amorti ticket
  covoiturage: 0.05,
  voiture_perso: 0.18, // carburant + amortissement
  avion: 0.15,
  train: 0.08,
}

export type CleanModeFromMobility<M extends MobilityMode> =
  M extends CleanMobilityMode ? M : never
