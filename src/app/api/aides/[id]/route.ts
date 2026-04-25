import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const { data: aide } = await supabase
      .from('aides')
      .select('*')
      .eq(isUuid ? 'id' : 'slug', id)
      .eq('active', true)
      .maybeSingle()

    if (!aide) return NextResponse.json({ error: 'Aide introuvable' }, { status: 404 })

    const { data: sub } = await supabase
      .from('aides_subscriptions')
      .select('id, status, notes, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('aide_id', aide.id)
      .maybeSingle()

    return NextResponse.json({ aide, subscription: sub ?? null })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
