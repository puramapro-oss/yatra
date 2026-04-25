import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { computeBearing, haversineKm, cardinalDirection } from '@/lib/geo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius_km: z.coerce.number().min(0.1).max(200).default(20),
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const parsed = QuerySchema.safeParse({
      lat: url.searchParams.get('lat'),
      lon: url.searchParams.get('lon'),
      radius_km: url.searchParams.get('radius_km'),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres lat/lon invalides' }, { status: 400 })
    }

    const me = { lat: parsed.data.lat, lon: parsed.data.lon }

    // Charge sources potentielles (le filtrage spatial fin se fait en JS — DB n'a pas PostGIS ici)
    const [{ data: events }, { data: partners }] = await Promise.all([
      supabase
        .from('gratuit_events')
        .select('id, slug, title, category, city, lat, lon')
        .eq('active', true)
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .limit(200),
      supabase
        .from('transport_partners')
        .select('id, slug, name, type, city, lat, lon')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .limit(100),
    ])

    type Pin = {
      kind: 'event' | 'partner'
      id: string
      slug: string
      title: string
      category: string | null
      city: string | null
      lat: number
      lon: number
      distance_km: number
      bearing_deg: number
      cardinal: string
    }

    const pins: Pin[] = []
    for (const e of events ?? []) {
      if (e.lat == null || e.lon == null) continue
      const distance = haversineKm(me, { lat: e.lat, lon: e.lon })
      if (distance > parsed.data.radius_km) continue
      const bearing = computeBearing(me, { lat: e.lat, lon: e.lon })
      pins.push({
        kind: 'event',
        id: e.id,
        slug: e.slug,
        title: e.title,
        category: e.category,
        city: e.city,
        lat: e.lat,
        lon: e.lon,
        distance_km: Number(distance.toFixed(2)),
        bearing_deg: Number(bearing.toFixed(1)),
        cardinal: cardinalDirection(bearing),
      })
    }
    for (const p of partners ?? []) {
      if (p.lat == null || p.lon == null) continue
      const distance = haversineKm(me, { lat: p.lat, lon: p.lon })
      if (distance > parsed.data.radius_km) continue
      const bearing = computeBearing(me, { lat: p.lat, lon: p.lon })
      pins.push({
        kind: 'partner',
        id: p.id,
        slug: p.slug,
        title: p.name,
        category: p.type,
        city: p.city,
        lat: p.lat,
        lon: p.lon,
        distance_km: Number(distance.toFixed(2)),
        bearing_deg: Number(bearing.toFixed(1)),
        cardinal: cardinalDirection(bearing),
      })
    }

    pins.sort((a, b) => a.distance_km - b.distance_km)

    return NextResponse.json({
      origin: me,
      radius_km: parsed.data.radius_km,
      total: pins.length,
      pins: pins.slice(0, 20),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
