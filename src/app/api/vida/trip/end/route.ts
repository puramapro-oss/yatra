import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { analyzeTrip } from '@/lib/anti-fraud'
import { VIDA_CREDITS_PER_KM, CO2_AVOIDED_PER_KM, isCleanMode } from '@/lib/wow'
import { ancienneteMultiplier } from '@/lib/utils'
import { creditWallet } from '@/lib/wallet'
import type { GpsPoint, RouteGeometry } from '@/types/trip'
import type { CleanMobilityMode } from '@/types/vida'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000),
  t: z.number().int().positive(),
  speed: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  altitude: z.number().nullable().optional(),
})

const endSchema = z.object({
  trip_id: z.string().uuid(),
  points: z.array(pointSchema).min(2).max(5000),
})

const FRAUD_REJECT_THRESHOLD = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { trip_id, points } = endSchema.parse(body)

    const { data: trip, error: tErr } = await supabase
      .from('trips')
      .select('id, user_id, declared_mode, status, started_at')
      .eq('id', trip_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (tErr || !trip) {
      return NextResponse.json({ error: 'Trajet introuvable' }, { status: 404 })
    }
    if (trip.status !== 'active') {
      return NextResponse.json({ error: 'Trajet déjà clos' }, { status: 409 })
    }

    const declared_mode = trip.declared_mode as Parameters<typeof analyzeTrip>[0]['declared_mode']
    const result = analyzeTrip({ points: points as GpsPoint[], declared_mode })

    const isFlagged = result.fraud_score >= FRAUD_REJECT_THRESHOLD
    const newStatus = isFlagged ? 'flagged' : 'completed'

    const distance_km = result.distance_km
    const startedAtMs = new Date(trip.started_at).getTime()
    const lastT = points[points.length - 1].t
    const duration_min = Math.max(0, Math.round(((lastT - startedAtMs) / 1000 / 60) * 10) / 10)

    // Multiplicateur ancienneté ×1 → ×2 (cap 12 mois)
    const { data: profile } = await supabase
      .from('profiles')
      .select('anciennete_months')
      .eq('id', user.id)
      .maybeSingle()
    const anciennete_months = Math.min(profile?.anciennete_months ?? 0, 12)
    const multiplier = ancienneteMultiplier(anciennete_months)

    // Crédits + CO₂ — uniquement si non flagged ET mode propre
    let gain_credits_eur = 0
    let gain_base_eur = 0
    let co2_avoided_kg = 0
    if (!isFlagged && isCleanMode(declared_mode)) {
      gain_base_eur =
        Math.round(distance_km * VIDA_CREDITS_PER_KM[declared_mode as CleanMobilityMode] * 100) / 100
      gain_credits_eur = Math.round(gain_base_eur * multiplier * 100) / 100
      co2_avoided_kg = Math.round(distance_km * CO2_AVOIDED_PER_KM[declared_mode] * 100) / 100
    }

    // Geometry à partir des points (simplification au passage : 1 point sur 5 si > 200 points)
    const decimate = points.length > 200 ? Math.ceil(points.length / 200) : 1
    const coords: [number, number][] = points
      .filter((_, i) => i % decimate === 0)
      .map((p) => [p.lon, p.lat])
    const geometry: RouteGeometry = { type: 'LineString', coordinates: coords }

    // Update trip
    await supabase
      .from('trips')
      .update({
        status: newStatus,
        detected_mode: result.detected_mode,
        distance_km,
        duration_min,
        gain_credits_eur,
        co2_avoided_kg,
        fraud_score: result.fraud_score,
        fraud_reasons: result.reasons,
        geometry,
        ended_at: new Date(lastT).toISOString(),
      })
      .eq('id', trip_id)

    // Save GPS track
    const speeds = []
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]
      const b = points[i]
      const dtH = Math.max((b.t - a.t) / 1000 / 3600, 1 / 3600)
      const seg = (Math.acos(
        Math.min(1, Math.max(-1,
          Math.sin((a.lat * Math.PI) / 180) * Math.sin((b.lat * Math.PI) / 180) +
          Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
          Math.cos(((b.lon - a.lon) * Math.PI) / 180),
        )),
      ) * 6371) / dtH
      if (Number.isFinite(seg)) speeds.push(seg)
    }
    const max_speed_kmh = speeds.length ? Math.round(Math.max(...speeds) * 10) / 10 : 0
    const avg_speed_kmh = speeds.length ? Math.round((speeds.reduce((s, x) => s + x, 0) / speeds.length) * 10) / 10 : 0

    await supabase.from('gps_tracks').upsert({
      trip_id,
      user_id: user.id,
      points: points,
      count: points.length,
      avg_speed_kmh,
      max_speed_kmh,
    })

    // Crédit wallet via RPC atomique (event-sourcing wallet_transactions + UPDATE wallets)
    if (gain_credits_eur > 0) {
      try {
        await creditWallet({
          userId: user.id,
          amount: gain_credits_eur,
          source: 'trip_clean',
          description: `Trajet ${declared_mode} ${distance_km} km${multiplier > 1 ? ` (×${multiplier.toFixed(2)})` : ''}`,
          sourceId: trip_id,
        })
      } catch (creditErr) {
        // Si le crédit échoue, on log mais on n'invalide pas le trip déjà sauvegardé
        // L'admin peut crédit manuellement depuis la table wallet_transactions
        const reason = creditErr instanceof Error ? creditErr.message : 'unknown'
        await supabase.from('admin_logs').insert({
          action: 'credit_wallet_failed',
          target_type: 'wallets',
          target_id: user.id,
          details: { trip_id, amount: gain_credits_eur, reason },
        })
      }
    }

    // Fil de Vie — append-only
    await supabase.from('fil_de_vie').insert({
      user_id: user.id,
      app_slug: 'yatra',
      event_type: isFlagged ? 'trip_flagged' : 'first_clean_trip',
      payload: {
        trip_id,
        declared_mode,
        detected_mode: result.detected_mode,
        distance_km,
        gain_credits_eur,
        fraud_score: result.fraud_score,
      },
      irreversible: true,
    })

    return NextResponse.json({
      status: newStatus,
      distance_km,
      duration_min,
      gain_credits_eur,
      gain_base_eur,
      multiplier_anciennete: multiplier,
      co2_avoided_kg,
      fraud_score: result.fraud_score,
      reasons: result.reasons,
      detected_mode: result.detected_mode,
      avg_speed_kmh,
      max_speed_kmh,
    })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
