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
    const status = url.searchParams.get('status') ?? 'open'
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)

    let q = supabase
      .from('group_purchases')
      .select('id, creator_id, title, description, category, city, target_count, current_count, unit_price_eur, group_price_eur, savings_percent, deadline, status, partner_url, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (status !== 'all') q = q.eq('status', status)

    const { data: groups, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // User memberships
    const { data: memberships } = await supabase
      .from('group_purchase_members')
      .select('group_id')
      .eq('user_id', user.id)
    const joinedSet = new Set((memberships ?? []).map((m) => m.group_id))

    const enriched = (groups ?? []).map((g) => ({ ...g, _joined: joinedSet.has(g.id) }))
    return NextResponse.json({ groups: enriched })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
