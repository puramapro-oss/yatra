import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { currentWeekRange } from '@/lib/contests'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { start, end } = currentWeekRange()

  // Top 100 entries semaine en cours
  const { data: entries } = await supabase
    .from('contests_entries')
    .select('user_id, score, tickets, profiles!inner(full_name)')
    .eq('contest_type', 'weekly_performance')
    .eq('period_start', start)
    .order('score', { ascending: false })
    .limit(100)

  // Position du user courant
  let myPosition: number | null = null
  if (entries) {
    const idx = entries.findIndex((e) => e.user_id === user.id)
    if (idx >= 0) myPosition = idx + 1
  }

  // Mon entry
  const { data: myEntry } = await supabase
    .from('contests_entries')
    .select('user_id, score, tickets, eligible')
    .eq('user_id', user.id)
    .eq('contest_type', 'weekly_performance')
    .eq('period_start', start)
    .maybeSingle()

  // Reward pool actuel
  const { data: pool } = await supabase
    .from('pool_balances')
    .select('balance_eur')
    .eq('pool_type', 'reward')
    .maybeSingle()

  return NextResponse.json({
    period: { start, end },
    pool_balance_eur: Number(pool?.balance_eur ?? 0),
    leaderboard: entries ?? [],
    my_position: myPosition,
    my_entry: myEntry ?? { score: 0, tickets: 0, eligible: true },
  })
}
