/**
 * Geocoding via Nominatim (OpenStreetMap) — gratuit, RGPD.
 * Conformité OSM Usage Policy : User-Agent obligatoire, < 1 req/s.
 */

import type { GeocodeResult } from '@/types/trip'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'YATRA/1.0 (https://yatra.purama.dev contact@purama.dev)'

export async function searchPlace(query: string, limit = 5): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return []
  const url = new URL(`${NOMINATIM_BASE}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('addressdetails', '0')
  url.searchParams.set('accept-language', 'fr')
  const r = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    next: { revalidate: 86400 },
  })
  if (!r.ok) return []
  const data = (await r.json()) as Array<{ display_name: string; lat: string; lon: string }>
  return data.map((d) => ({
    label: d.display_name,
    lat: Number(d.lat),
    lon: Number(d.lon),
  }))
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('format', 'json')
  url.searchParams.set('zoom', '14')
  url.searchParams.set('accept-language', 'fr')
  const r = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    next: { revalidate: 86400 },
  })
  if (!r.ok) return null
  const data = (await r.json()) as { display_name?: string }
  return data.display_name ?? null
}
