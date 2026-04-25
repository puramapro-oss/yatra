import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clusterReports, type SafetyReport } from '@/lib/safety'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULT_RADIUS_KM = 5
const MAX_RADIUS_KM = 20

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lon = parseFloat(searchParams.get('lon') ?? '')
  const radiusKm = Math.min(
    MAX_RADIUS_KM,
    Math.max(0.5, parseFloat(searchParams.get('radius_km') ?? String(DEFAULT_RADIUS_KM))),
  )

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat / lon requis' }, { status: 400 })
  }

  // Bounding box approximative (1 deg lat = 111 km)
  const dLat = radiusKm / 111
  const dLon = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1)

  const { data: rows, error } = await supabase
    .from('safety_reports')
    .select('id, user_id, category, severity, lat, lon, description, status, upvotes, downvotes, expires_at, created_at')
    .eq('status', 'active')
    .gte('lat', lat - dLat)
    .lte('lat', lat + dLat)
    .gte('lon', lon - dLon)
    .lte('lon', lon + dLon)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return NextResponse.json({ error: 'Erreur lecture safety_reports' }, { status: 500 })
  }

  const reports = (rows ?? []) as SafetyReport[]
  const clusters = clusterReports(reports)

  return NextResponse.json({
    center: { lat, lon },
    radius_km: radiusKm,
    count: reports.length,
    clusters,
    reports,
  })
}
