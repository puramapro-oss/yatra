import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rankMissions, type HumanitarianMission } from '@/lib/humanitarian-matcher'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const cause = url.searchParams.get('cause')
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 30), 100)

    const { data: profile } = await supabase
      .from('profiles')
      .select('age, ville_principale, region_principale, situations')
      .eq('id', user.id)
      .maybeSingle()

    let q = supabase
      .from('humanitarian_missions')
      .select('id, slug, title, ngo_name, ngo_url, cause, destination_city, destination_country, description, duration_days, starts_at, ends_at, spots_total, spots_taken, cost_eur, transport_discount_pct, required_age_min, prerequisites, contact_email')
      .eq('active', true)

    if (cause) q = q.eq('cause', cause)

    const { data: missions, error } = await q.order('starts_at', { ascending: true, nullsFirst: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const ranked = rankMissions((missions ?? []) as HumanitarianMission[], {
      age: profile?.age ?? null,
      ville_principale: profile?.ville_principale ?? null,
      region: profile?.region_principale ?? null,
      situations: profile?.situations ?? [],
    }).slice(0, limit)

    return NextResponse.json({ total: ranked.length, missions: ranked })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
