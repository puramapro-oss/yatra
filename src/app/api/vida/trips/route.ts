import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)
    const status = url.searchParams.get('status')

    let query = supabase
      .from('trips')
      .select('id, status, declared_mode, detected_mode, distance_km, duration_min, gain_credits_eur, co2_avoided_kg, fraud_score, from_label, to_label, started_at, ended_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data: trips, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trips: trips ?? [] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
