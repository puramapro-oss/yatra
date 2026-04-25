/**
 * Routing abstraction (server-only).
 * Default : OSRM public demo (router.project-osrm.org) — gratuit, sans token.
 * Auto-upgrade : Mapbox Directions si NEXT_PUBLIC_MAPBOX_TOKEN est défini.
 *
 * Cache : table yatra.route_cache (TTL 7j).
 *
 * NOTE : ne JAMAIS importer depuis le client — tire next/headers via service client.
 * Côté client, utiliser haversineKm depuis '@/lib/geo'.
 */

import 'server-only'
import { createHash } from 'node:crypto'
import { MODE_TO_OSRM, type OsrmProfile } from '@/types/trip'
import type { RouteGeometry } from '@/types/trip'
import type { MobilityMode } from '@/types/vida'
import { createServiceClient } from '@/lib/supabase/server'
import { haversineKm, type Coord } from '@/lib/geo'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'
const MAPBOX_BASE = 'https://api.mapbox.com/directions/v5/mapbox'

export type RouteResult = {
  distance_km: number
  duration_min: number
  geometry: RouteGeometry | null
  provider: 'osrm' | 'mapbox' | 'haversine'
}

export type { Coord }
export { haversineKm }

function cacheKey(from: Coord, to: Coord, profile: OsrmProfile): string {
  const raw = `${from.lat.toFixed(5)}:${from.lon.toFixed(5)}:${to.lat.toFixed(5)}:${to.lon.toFixed(5)}:${profile}`
  return createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

async function readCache(key: string): Promise<RouteResult | null> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('route_cache')
      .select('distance_km, duration_min, geometry, provider, expires_at')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (!data) return null
    return {
      distance_km: Number(data.distance_km),
      duration_min: Number(data.duration_min),
      geometry: (data.geometry as RouteGeometry | null) ?? null,
      provider: data.provider as RouteResult['provider'],
    }
  } catch {
    return null
  }
}

async function writeCache(
  key: string,
  from: Coord,
  to: Coord,
  profile: OsrmProfile,
  res: RouteResult,
): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase
      .from('route_cache')
      .upsert({
        cache_key: key,
        profile,
        from_lat: from.lat,
        from_lon: from.lon,
        to_lat: to.lat,
        to_lon: to.lon,
        distance_km: res.distance_km,
        duration_min: res.duration_min,
        geometry: res.geometry,
        provider: res.provider,
        hits: 1,
      })
  } catch {
    // cache best-effort
  }
}

async function getMapboxRoute(from: Coord, to: Coord, profile: OsrmProfile): Promise<RouteResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null
  const url = `${MAPBOX_BASE}/${profile === 'driving' ? 'driving' : profile}/${from.lon},${from.lat};${to.lon},${to.lat}?geometries=geojson&overview=simplified&access_token=${token}`
  const r = await fetch(url, { next: { revalidate: 0 } })
  if (!r.ok) return null
  const data = await r.json()
  const route = data?.routes?.[0]
  if (!route) return null
  return {
    distance_km: Math.round((route.distance / 1000) * 100) / 100,
    duration_min: Math.round((route.duration / 60) * 10) / 10,
    geometry: route.geometry as RouteGeometry,
    provider: 'mapbox',
  }
}

async function getOsrmRoute(from: Coord, to: Coord, profile: OsrmProfile): Promise<RouteResult | null> {
  const url = `${OSRM_BASE}/${profile}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=simplified&geometries=geojson`
  const r = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  })
  if (!r.ok) return null
  const data = await r.json()
  const route = data?.routes?.[0]
  if (!route) return null
  return {
    distance_km: Math.round((route.distance / 1000) * 100) / 100,
    duration_min: Math.round((route.duration / 60) * 10) / 10,
    geometry: route.geometry as RouteGeometry,
    provider: 'osrm',
  }
}

/**
 * Calcule un itinéraire pour un mode de mobilité.
 * Stratégie : cache → Mapbox (si token) → OSRM → Haversine fallback.
 */
export async function getRoute(
  from: Coord,
  to: Coord,
  mode: MobilityMode,
): Promise<RouteResult> {
  const profile = MODE_TO_OSRM[mode]
  const key = cacheKey(from, to, profile)

  const cached = await readCache(key)
  if (cached) return cached

  const mapbox = await getMapboxRoute(from, to, profile).catch(() => null)
  if (mapbox) {
    await writeCache(key, from, to, profile, mapbox)
    return mapbox
  }

  const osrm = await getOsrmRoute(from, to, profile).catch(() => null)
  if (osrm) {
    await writeCache(key, from, to, profile, osrm)
    return osrm
  }

  const km = Math.round(haversineKm(from, to) * 100) / 100
  const speedKmh: Record<OsrmProfile, number> = { walking: 5, cycling: 16, driving: 50 }
  const duration_min = Math.round((km / speedKmh[profile]) * 60 * 10) / 10
  return {
    distance_km: km,
    duration_min,
    geometry: { type: 'LineString', coordinates: [[from.lon, from.lat], [to.lon, to.lat]] },
    provider: 'haversine',
  }
}
