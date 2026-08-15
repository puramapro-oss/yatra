import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MOBILITY_POOL_DAILY_BUDGET = Number(process.env.MOBILITY_POOL_DAILY_BUDGET ?? 5000)

export async function GET(request: Request) {
  try {
    // Auth CRON_SECRET (pattern existant aides-research, cleanup-aria)
    const authHeader = request.headers.get('authorization')
    const cronHeader = request.headers.get('x-vercel-cron')
    const expectedToken = `Bearer ${process.env.CRON_SECRET ?? ''}`

    if (authHeader !== expectedToken && cronHeader !== '1') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Sum(amount) wallet_transactions WHERE source='trip_clean' AND created_at >= now()-'24h'
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: txs, error: txErr } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('source', 'trip_clean')
      .gte('created_at', yesterday)

    if (txErr) {
      return NextResponse.json({ error: `Erreur lecture transactions : ${txErr.message}` }, { status: 500 })
    }

    const total_distributed = (txs ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0)
    const total_distributed_eur = Math.round(total_distributed * 100) / 100
    const budget_pool_eur = MOBILITY_POOL_DAILY_BUDGET
    const status = total_distributed_eur > budget_pool_eur ? 'alerte' : 'ok'

    // Insert ledger (date = today)
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const { error: insertErr } = await supabase.from('mobility_pool_ledger').upsert(
      {
        date: today,
        total_distributed_eur,
        budget_pool_eur,
        status,
      },
      { onConflict: 'date' },
    )

    if (insertErr) {
      return NextResponse.json({ error: `Erreur insert ledger : ${insertErr.message}` }, { status: 500 })
    }

    return NextResponse.json({
      date: today,
      total_distributed_eur,
      budget_pool_eur,
      status,
      threshold_iso: yesterday,
      count_tx: txs?.length ?? 0,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
