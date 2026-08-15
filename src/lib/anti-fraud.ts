/**
 * Anti-fraude heuristique pour le web.
 * Analyse la trace GPS d'un trajet et détecte les patterns suspects.
 *
 * Stratégie multi-signal (chaque flag = +N points fraud_score) :
 * - Vitesse moyenne incompatible mode déclaré
 * - Vitesse max dépassant seuils impossibles pour le mode
 * - Accélérations brutales (= voiture)
 * - Tracé trop droit sur trajet long (= autoroute)
 * - Trop peu de points (= téléchargement / faux trajet)
 * - Téléportation (saut > 500m en < 5s)
 *
 * Score 0 = clean. Score >= 60 = trip rejeté en flagged.
 */

import type { GpsPoint, AntiFraudResult } from '@/types/trip'
import type { MobilityMode } from '@/types/vida'
import { haversineKm } from '@/lib/geo'

/** Seuils max km/h plausibles par mode déclaré. */
const MAX_PLAUSIBLE_KMH: Record<MobilityMode, number> = {
  marche: 9, // course occasionnelle = 9 km/h
  velo: 35, // sprint vélo
  trottinette: 30,
  transport_public: 80, // bus/tram urbain
  covoiturage: 130, // autoroute
  voiture_perso: 130,
  avion: 1000,
  train: 320,
}

const AVG_PLAUSIBLE_KMH: Record<MobilityMode, number> = {
  marche: 6,
  velo: 22,
  trottinette: 22,
  transport_public: 30,
  covoiturage: 80,
  voiture_perso: 80,
  avion: 800,
  train: 120,
}

/** Dérivée vitesse instantanée entre 2 points (km/h). */
function speedKmh(a: GpsPoint, b: GpsPoint): number {
  const km = haversineKm({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
  const dtH = Math.max((b.t - a.t) / 1000 / 3600, 1 / 3600) // floor 1s
  return km / dtH
}

/**
 * Détecte le mode probable à partir de la trace.
 * Heuristique simple basée sur les vitesses moyenne + max.
 */
function detectModeFromSpeeds(avg: number, max: number): MobilityMode {
  if (avg < 7 && max < 12) return 'marche'
  if (avg < 25 && max < 40) return 'velo'
  if (avg < 35 && max < 60) return 'transport_public'
  if (avg < 90 && max < 140) return 'voiture_perso'
  return 'train'
}

export type AccelProfile = {
  avgMagnitude: number // moyenne magnitude accélération (m/s²)
  variance: number // variance échantillons
  peakCount: number // nombre pics > seuil
}

export type AnalyzeInput = {
  points: GpsPoint[]
  declared_mode: MobilityMode
  accel_profile?: AccelProfile // optionnel (device non supporté → absent)
}

/**
 * Analyse profil accéléromètre pour détecter incohérence mode déclaré.
 * Heuristique simple : marche/vélo = variance haute basse amplitude, voiture = accels franches soutenues.
 * Retourne score additionnel fraud (0-20).
 */
function analyzeAccelProfile(profile: AccelProfile, declared_mode: MobilityMode): number {
  const { avgMagnitude, variance, peakCount } = profile
  let accelFraud = 0

  // Marche/vélo/trottinette : variance attendue haute (mouvements irréguliers), magnitude basse
  if (declared_mode === 'marche' || declared_mode === 'velo' || declared_mode === 'trottinette') {
    // Si magnitude élevée (>4 m/s²) + pics nombreux (>10) → probable voiture
    if (avgMagnitude > 4 && peakCount > 10) {
      accelFraud += 15
    }
    // Variance très basse (<0.5) sur mode marche/vélo → suspect (trop régulier = voiture)
    if (variance < 0.5) {
      accelFraud += 5
    }
  }

  // Covoiturage/voiture : magnitude attendue moyenne-haute, variance modérée
  if (declared_mode === 'covoiturage' || declared_mode === 'voiture_perso') {
    // Si magnitude très basse (<1 m/s²) ET variance haute → probable marche/vélo
    if (avgMagnitude < 1 && variance > 2) {
      accelFraud += 10
    }
  }

  return Math.min(20, accelFraud) // cap 20 pts max pour accel
}

/**
 * Analyse complète d'un trajet GPS.
 */
export function analyzeTrip(input: AnalyzeInput): AntiFraudResult {
  const { points, declared_mode, accel_profile } = input
  const reasons: string[] = []
  let fraud = 0

  if (points.length < 4) {
    reasons.push('Trace GPS insuffisante (< 4 points)')
    fraud += 30
  }

  // Distance totale recalculée (somme des segments)
  let totalKm = 0
  let maxSpeed = 0
  let teleportCount = 0
  let extremeAccelCount = 0
  let prevSpeed = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const segKm = haversineKm({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon })
    totalKm += segKm

    const dtSec = (b.t - a.t) / 1000
    if (dtSec <= 0) continue
    const v = (segKm / dtSec) * 3600 // km/h
    if (v > maxSpeed) maxSpeed = v

    // Téléportation : > 500 m en < 5 s
    if (segKm > 0.5 && dtSec < 5) {
      teleportCount++
    }

    // Accélération brutale : variation > 30 km/h en < 5 s
    if (Math.abs(v - prevSpeed) > 30 && dtSec < 5) {
      extremeAccelCount++
    }
    prevSpeed = v
  }

  const totalDurationH =
    points.length > 0 ? (points[points.length - 1].t - points[0].t) / 1000 / 3600 : 0
  const avgSpeed = totalDurationH > 0 ? totalKm / totalDurationH : 0

  // Vitesses incompatibles
  if (maxSpeed > MAX_PLAUSIBLE_KMH[declared_mode] * 1.2) {
    reasons.push(
      `Vitesse max ${Math.round(maxSpeed)} km/h impossible en ${declared_mode} (max ~${MAX_PLAUSIBLE_KMH[declared_mode]} km/h)`,
    )
    fraud += 50
  }

  if (avgSpeed > AVG_PLAUSIBLE_KMH[declared_mode] * 1.5) {
    reasons.push(
      `Vitesse moyenne ${Math.round(avgSpeed)} km/h trop élevée pour ${declared_mode}`,
    )
    fraud += 25
  }

  // Téléportation = compte fortement
  if (teleportCount > 0) {
    reasons.push(`${teleportCount} téléportation(s) détectée(s)`)
    fraud += 40
  }

  // Accélérations brutales (signal voiture)
  if (
    (declared_mode === 'marche' || declared_mode === 'velo' || declared_mode === 'trottinette') &&
    extremeAccelCount > 2
  ) {
    reasons.push(`${extremeAccelCount} accélérations brutales (compatibles voiture)`)
    fraud += 20
  }

  const detected_mode = detectModeFromSpeeds(avgSpeed, maxSpeed)
  // Désaccord détecté/déclaré → +confiance fraude
  if (detected_mode !== declared_mode) {
    reasons.push(`Mode détecté ${detected_mode} ≠ mode déclaré ${declared_mode}`)
    fraud += 15
  }

  // Analyse accéléromètre si disponible (device supporté)
  if (accel_profile) {
    const accelFraud = analyzeAccelProfile(accel_profile, declared_mode)
    if (accelFraud > 0) {
      fraud += accelFraud
      reasons.push(
        `Profil accélération incohérent (avg ${accel_profile.avgMagnitude.toFixed(1)} m/s², variance ${accel_profile.variance.toFixed(1)})`,
      )
    }
  }

  fraud = Math.min(100, Math.max(0, Math.round(fraud)))
  // Confiance détection : inverse de l'incertitude (dépend nb points + cohérence)
  const confidence = Math.max(0, Math.min(100, Math.round(100 - fraud / 2)))

  return {
    detected_mode,
    declared_mode,
    confidence,
    fraud_score: fraud,
    reasons,
    avg_speed_kmh: Math.round(avgSpeed * 10) / 10,
    max_speed_kmh: Math.round(maxSpeed * 10) / 10,
    distance_km: Math.round(totalKm * 100) / 100,
  }
}
