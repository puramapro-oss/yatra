import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { previousWeekRange, weeklyDistribution } from '@/lib/contests'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authOk(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const auth = request.headers.get('authorization') ?? ''
  if (auth === `Bearer ${expected}`) return true
  const vercelHeader = request.headers.get('x-vercel-cron')
  return vercelHeader === '1'
}

export async function POST(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return runWeekly()
}

export async function GET(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return runWeekly()
}

async function runWeekly() {
  const supabase = createServiceClient()
  const { start, end } = previousWeekRange()

  // 1. Vérifier qu'on n'a pas déjà processé cette période
  const { data: existing } = await supabase
    .from('contests_results')
    .select('id')
    .eq('type', 'weekly_performance')
    .eq('period_start', start)
    .eq('period_end', end)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, status: 'already_processed', period: { start, end } })
  }

  // 2. Top 10 entries semaine précédente
  const { data: top10 } = await supabase
    .from('contests_entries')
    .select('user_id, score')
    .eq('contest_type', 'weekly_performance')
    .eq('period_start', start)
    .gt('score', 0)
    .order('score', { ascending: false })
    .limit(10)

  if (!top10 || top10.length === 0) {
    // Insert "no winners" stub
    await supabase.from('contests_results').insert({
      type: 'weekly_performance',
      period_start: start,
      period_end: end,
      total_pool_eur: 0,
      winners: [],
      total_distributed_eur: 0,
      status: 'completed',
      metadata: { reason: 'no_eligible_entries' },
    })
    return NextResponse.json({ ok: true, status: 'no_winners', period: { start, end } })
  }

  // 3. Pool reward actuel
  const { data: pool } = await supabase
    .from('pool_balances')
    .select('balance_eur')
    .eq('pool_type', 'reward')
    .maybeSingle()

  const totalPool = Number(pool?.balance_eur ?? 0)
  const distributable = Math.min(totalPool, 10000) // safety cap pré-Treezor

  // 4. Calculer distribution
  const winners = top10.map((entry, idx) => ({
    user_id: entry.user_id,
    rank: idx + 1,
    score: Number(entry.score),
    amount_eur: weeklyDistribution(idx + 1, distributable),
  }))

  const totalDistributed = winners.reduce((s, w) => s + w.amount_eur, 0)

  // 5. Crédite chaque gagnant via wallet_transactions + UPDATE wallets
  for (const w of winners) {
    if (w.amount_eur <= 0) continue
    try {
      // Insert transaction + upsert wallet (similaire pattern challenge complete)
      await supabase.from('wallet_transactions').insert({
        user_id: w.user_id,
        amount: w.amount_eur,
        source: 'contest',
        description: `Classement hebdo · ${start}→${end} · #${w.rank}`,
        source_id: null,
        balance_after: 0, // sera mis à jour par trigger ou patch ultérieur
      })
      await supabase.from('wallets').upsert(
        {
          user_id: w.user_id,
          balance: w.amount_eur,
          total_earned: w.amount_eur,
        },
        { onConflict: 'user_id', ignoreDuplicates: false },
      )
    } catch {
      // Logger admin_logs si échoue
      await supabase.from('admin_logs').insert({
        action: 'contest_weekly_credit_failed',
        target_type: 'wallets',
        target_id: w.user_id,
        details: { amount: w.amount_eur, period: `${start}→${end}` },
      })
    }
  }

  // 6. Pool debit
  if (totalDistributed > 0) {
    await supabase.rpc('pool_debit_v1' as never, {
      p_pool_type: 'reward',
      p_amount_eur: totalDistributed,
      p_reason: 'contest_payout_weekly',
      p_metadata: { period: `${start}→${end}`, winners_count: winners.length },
    } as never)
  }

  // 7. Insert résultat
  await supabase.from('contests_results').insert({
    type: 'weekly_performance',
    period_start: start,
    period_end: end,
    total_pool_eur: distributable,
    winners,
    total_distributed_eur: totalDistributed,
    status: 'completed',
    metadata: { algorithm: 'top10_score' },
  })

  return NextResponse.json({
    ok: true,
    status: 'distributed',
    period: { start, end },
    winners_count: winners.length,
    total_distributed_eur: totalDistributed,
  })
}
