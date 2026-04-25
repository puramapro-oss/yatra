import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { findTemplate } from '@/lib/challenges'
import { recordTrustEvent } from '@/lib/trust'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST — soumettre une preuve pour un jour donné (par défaut aujourd'hui)
const proofSchema = z.object({
  day_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // ISO date
  trip_id: z.string().uuid().optional(),
  code: z.string().min(2).max(20).optional(),
  note: z.string().max(500).optional(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = proofSchema.parse(body)

    // Default day = today
    const dayDate = data.day_date ?? new Date().toISOString().slice(0, 10)

    // Récupère challenge + template pour valider la preuve type
    const { data: challenge } = await supabase
      .from('challenges_stake')
      .select('id, template_slug, status, start_date, end_date')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge introuvable' }, { status: 404 })
    }
    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge non actif' }, { status: 409 })
    }

    const tpl = findTemplate(challenge.template_slug)
    if (!tpl) {
      return NextResponse.json({ error: 'Template introuvable' }, { status: 500 })
    }

    let proofValue: Record<string, unknown> = { note: data.note ?? null }
    let fraudScore: number | null = null

    // Validation selon proof_type
    if (tpl.proof_type === 'trip_clean') {
      if (!data.trip_id) {
        return NextResponse.json({ error: 'trip_id requis pour ce challenge' }, { status: 400 })
      }
      const { data: trip } = await supabase
        .from('trips')
        .select('id, declared_mode, status, distance_km, ended_at, fraud_score')
        .eq('id', data.trip_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!trip) {
        return NextResponse.json({ error: 'Trajet introuvable' }, { status: 404 })
      }
      if (trip.status !== 'completed') {
        return NextResponse.json({ error: 'Trajet non finalisé / flagged' }, { status: 409 })
      }
      // Vérifie mode requis si défini par template
      if (tpl.required_modes && !tpl.required_modes.includes(trip.declared_mode as never)) {
        return NextResponse.json({
          error: `Ce challenge requiert un trajet : ${tpl.required_modes.join(', ')}`,
        }, { status: 409 })
      }
      // Vérifie distance min 1 km pour preuve
      if ((trip.distance_km ?? 0) < 1) {
        return NextResponse.json({ error: 'Trajet < 1 km — pas suffisant pour preuve' }, { status: 409 })
      }
      // Vérifie ended_at est le bon jour
      if (trip.ended_at) {
        const tripDate = new Date(trip.ended_at).toISOString().slice(0, 10)
        if (tripDate !== dayDate) {
          return NextResponse.json({
            error: `Le trajet a été clôturé le ${tripDate}, pas le ${dayDate}`,
          }, { status: 409 })
        }
      }
      proofValue = {
        trip_id: trip.id,
        mode: trip.declared_mode,
        distance_km: trip.distance_km,
        note: data.note ?? null,
      }
      fraudScore = trip.fraud_score
    } else if (tpl.proof_type === 'photo_code') {
      if (!data.code || data.code.length < 2) {
        return NextResponse.json({ error: 'Code preuve requis' }, { status: 400 })
      }
      proofValue = { code: data.code, note: data.note ?? null }
    } else {
      // self_declared / gps_zone — note libre
      proofValue = { note: data.note ?? null, declared_at: new Date().toISOString() }
    }

    // RPC atomique
    const { data: result, error: rpcErr } = await supabase.rpc('submit_challenge_proof_v1' as never, {
      p_user_id: user.id,
      p_challenge_id: id,
      p_day_date: dayDate,
      p_proof_value: proofValue,
      p_fraud_score: fraudScore,
    } as never)

    if (rpcErr) {
      const msg = rpcErr.message
      if (msg.includes('day_already_validated')) {
        return NextResponse.json({ error: 'Preuve déjà validée pour ce jour' }, { status: 409 })
      }
      if (msg.includes('day_out_of_range')) {
        return NextResponse.json({ error: 'Jour hors période challenge' }, { status: 409 })
      }
      if (msg.includes('proof_fraud_detected')) {
        await recordTrustEvent({
          userId: user.id,
          type: 'proof_failed',
          reason: `Challenge proof fraud (score ${fraudScore})`,
          sourceId: id,
        })
        return NextResponse.json({ error: 'Preuve rejetée — fraude détectée' }, { status: 422 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      result,
      day_date: dayDate,
    })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
