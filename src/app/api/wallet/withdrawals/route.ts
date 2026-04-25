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

    const { data: rows, error } = await supabase
      .from('withdrawals')
      .select('id, amount, status, bank_iban_last4, bank_holder_name, failure_reason, requested_at, completed_at')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ withdrawals: rows ?? [] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
