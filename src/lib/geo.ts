/**
 * Helpers géo isomorphes — réutilisables côté client et serveur.
 */

export type Coord = { lat: number; lon: number }

/** Distance Haversine en km. */
export function haversineKm(a: Coord, b: Coord): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

/**
 * Bearing initial entre 2 coords en degrés [0..360).
 * 0 = Nord vrai, 90 = Est, 180 = Sud, 270 = Ouest.
 */
export function computeBearing(from: Coord, to: Coord): number {
  const φ1 = (from.lat * Math.PI) / 180
  const φ2 = (to.lat * Math.PI) / 180
  const Δλ = ((to.lon - from.lon) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const θ = Math.atan2(y, x)
  return ((θ * 180) / Math.PI + 360) % 360
}

/** Convertit bearing (0..360) en cardinal NSEW (8 directions). */
export function cardinalDirection(bearing: number): 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SO' | 'O' | 'NO' {
  const idx = Math.round(bearing / 45) % 8
  return (['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const)[idx]
}

/** Différence angulaire signée [-180..+180] entre 2 bearings (utile pour AR). */
export function angleDiff(targetBearing: number, headingBearing: number): number {
  let diff = targetBearing - headingBearing
  while (diff > 180) diff -= 360
  while (diff < -180) diff += 360
  return diff
}
