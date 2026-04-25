import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, vida_credits, total_earned, total_withdrawn, total_from_trajets, total_from_referrals, total_from_contests, total_from_lottery, total_from_redistribution, bank_iban_last4, bank_holder_name, bank_details_filled, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: lastTx } = await supabase
      .from('wallet_transactions')
      .select('id, type, amount, balance_after, source, description, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: pendingWd } = await supabase
      .from('withdrawals')
      .select('id, amount, status, bank_iban_last4, requested_at, completed_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'pending_admin', 'processing'])
      .order('requested_at', { ascending: false })

    const pending_total = (pendingWd ?? []).reduce((s, w) => s + Number(w.amount), 0)

    return NextResponse.json({
      wallet: wallet ?? null,
      recent_transactions: lastTx ?? [],
      pending_withdrawals: pendingWd ?? [],
      pending_total,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
