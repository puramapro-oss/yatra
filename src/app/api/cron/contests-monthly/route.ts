import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { monthlyDistribution, pickLotteryWinners, previousMonthRange } from '@/lib/contests'

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
  return runMonthly()
}

export async function GET(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return runMonthly()
}

async function runMonthly() {
  const supabase = createServiceClient()
  const { start, end } = previousMonthRange()

  const { data: existing } = await supabase
    .from('contests_results')
    .select('id')
    .eq('type', 'monthly_lottery')
    .eq('period_start', start)
    .eq('period_end', end)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, status: 'already_processed', period: { start, end } })
  }

  // Eligible : entries du mois avec tickets > 0
  const { data: candidates } = await supabase
    .from('contests_entries')
    .select('user_id, tickets')
    .eq('contest_type', 'monthly_lottery')
    .eq('period_start', start)
    .gt('tickets', 0)
    .limit(10000)

  if (!candidates || candidates.length === 0) {
    await supabase.from('contests_results').insert({
      type: 'monthly_lottery',
      period_start: start,
      period_end: end,
      total_pool_eur: 0,
      winners: [],
      total_distributed_eur: 0,
      status: 'completed',
      metadata: { reason: 'no_candidates' },
    })
    return NextResponse.json({ ok: true, status: 'no_candidates', period: { start, end } })
  }

  // Pool jackpot lottery + reward
  const { data: pools } = await supabase
    .from('pool_balances')
    .select('pool_type, balance_eur')
    .in('pool_type', ['jackpot_lottery', 'reward'])

  const jackpotPool = Number(pools?.find((p) => p.pool_type === 'jackpot_lottery')?.balance_eur ?? 0)
  const rewardPool = Number(pools?.find((p) => p.pool_type === 'reward')?.balance_eur ?? 0)
  const totalPool = Math.min(jackpotPool + rewardPool, 5000) // safety cap pré-Treezor

  // Pick 10 winners pondérés tickets
  const winnerIds = pickLotteryWinners(
    candidates.map((c) => ({ user_id: c.user_id, tickets: c.tickets ?? 0 })),
    10,
  )

  const winners = winnerIds.map((uid, idx) => ({
    user_id: uid,
    rank: idx + 1,
    amount_eur: monthlyDistribution(idx + 1, totalPool),
    tickets: candidates.find((c) => c.user_id === uid)?.tickets ?? 0,
  }))

  const totalDistributed = winners.reduce((s, w) => s + w.amount_eur, 0)

  // Crédit + log
  for (const w of winners) {
    if (w.amount_eur <= 0) continue
    try {
      await supabase.from('wallet_transactions').insert({
        user_id: w.user_id,
        amount: w.amount_eur,
        source: 'lottery',
        description: `Tirage mensuel · ${start.slice(0, 7)} · #${w.rank}`,
        source_id: null,
        balance_after: 0,
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
      await supabase.from('admin_logs').insert({
        action: 'contest_monthly_credit_failed',
        target_type: 'wallets',
        target_id: w.user_id,
        details: { amount: w.amount_eur, period: `${start}→${end}` },
      })
    }
  }

  // Pool debit (jackpot first puis reward si pas assez)
  let remaining = totalDistributed
  if (jackpotPool > 0 && remaining > 0) {
    const debit = Math.min(remaining, jackpotPool)
    await supabase.rpc('pool_debit_v1' as never, {
      p_pool_type: 'jackpot_lottery',
      p_amount_eur: debit,
      p_reason: 'contest_payout_monthly',
      p_metadata: { period: `${start}→${end}` },
    } as never)
    remaining -= debit
  }
  if (remaining > 0) {
    await supabase.rpc('pool_debit_v1' as never, {
      p_pool_type: 'reward',
      p_amount_eur: remaining,
      p_reason: 'contest_payout_monthly',
      p_metadata: { period: `${start}→${end}` },
    } as never)
  }

  await supabase.from('contests_results').insert({
    type: 'monthly_lottery',
    period_start: start,
    period_end: end,
    total_pool_eur: totalPool,
    winners,
    total_distributed_eur: totalDistributed,
    status: 'completed',
    metadata: { algorithm: 'weighted_lottery_tickets', candidates_count: candidates.length },
  })

  return NextResponse.json({
    ok: true,
    status: 'distributed',
    period: { start, end },
    winners_count: winners.length,
    total_distributed_eur: totalDistributed,
    candidates_count: candidates.length,
  })
}
