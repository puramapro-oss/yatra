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
    const category = url.searchParams.get('category')

    let q = supabase
      .from('cashback_partners')
      .select('id, slug, name, category, description, logo_url, commission_pct, user_share_pct, ethical_score, popularity_score, max_cashback_eur, min_purchase_eur, conditions')
      .eq('active', true)

    if (category) q = q.eq('category', category)

    const { data: partners, error } = await q.order('popularity_score', { ascending: false }).limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ total: partners?.length ?? 0, partners: partners ?? [] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
