import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pickPromos, type CrossPromo } from '@/lib/cross-promo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const count = Math.min(2, parseInt(searchParams.get('count') ?? '2', 10))

  const { data: rows } = await supabase
    .from('cross_promos')
    .select('id, source_app, target_app, headline, body, emoji, cta_label, deeplink, category, active, priority, views, clicks')
    .eq('active', true)
    .order('priority', { ascending: false })
    .limit(20)

  const promos = (rows ?? []) as CrossPromo[]
  const picked = pickPromos(promos, count)

  return NextResponse.json({ promos: picked })
}
