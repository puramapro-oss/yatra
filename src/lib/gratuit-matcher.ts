/**
 * Matching events gratuits ↔ profil user.
 * Tri par : ville exacte → région → distance Haversine → popularité.
 */

import { haversineKm } from '@/lib/geo'

export type GratuitEvent = {
  id: string
  slug: string
  title: string
  category: string
  city: string
  region: string | null
  lat: number | null
  lon: number | null
  description: string | null
  starts_at: string | null
  recurrence: string | null
  url_official: string | null
}

export type GratuitMatch = GratuitEvent & { _distance_km: number | null; _score: number }

export function rankGratuit(
  events: GratuitEvent[],
  opts: { userCity: string; userRegion: string; userLat?: number | null; userLon?: number | null },
): GratuitMatch[] {
  const cityLower = opts.userCity.toLowerCase()
  return events
    .map((e) => {
      let distance: number | null = null
      let score = 0
      // Match ville exact
      if (e.city.toLowerCase() === cityLower) score += 60
      // Match région
      if (e.region === opts.userRegion) score += 25
      // National (FR)
      if (e.region === 'FR') score += 10
      // Distance bonus
      if (e.lat != null && e.lon != null && opts.userLat != null && opts.userLon != null) {
        distance = haversineKm({ lat: opts.userLat, lon: opts.userLon }, { lat: e.lat, lon: e.lon })
        if (distance < 5) score += 15
        else if (distance < 20) score += 8
        else if (distance < 100) score += 3
      }
      return { ...e, _distance_km: distance, _score: score }
    })
    .filter((e) => e._score > 0)
    .sort((a, b) => b._score - a._score)
}
