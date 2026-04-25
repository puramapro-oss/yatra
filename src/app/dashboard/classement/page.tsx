import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClassementView } from './ClassementView'
import { currentWeekRange } from '@/lib/contests'

export const dynamic = 'force-dynamic'

export default async function ClassementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { start, end } = currentWeekRange()

  const [{ data: entries }, { data: pool }, { data: myEntry }] = await Promise.all([
    supabase
      .from('contests_entries')
      .select('user_id, score, tickets, profiles!inner(full_name)')
      .eq('contest_type', 'weekly_performance')
      .eq('period_start', start)
      .order('score', { ascending: false })
      .limit(100),
    supabase
      .from('pool_balances')
      .select('balance_eur')
      .eq('pool_type', 'reward')
      .maybeSingle(),
    supabase
      .from('contests_entries')
      .select('user_id, score, tickets, eligible')
      .eq('user_id', user.id)
      .eq('contest_type', 'weekly_performance')
      .eq('period_start', start)
      .maybeSingle(),
  ])

  const myPosition = entries
    ? (entries.findIndex((e) => e.user_id === user.id) + 1) || null
    : null

  return (
    <ClassementView
      period={{ start, end }}
      poolBalanceEur={Number(pool?.balance_eur ?? 0)}
      entries={entries ?? []}
      myUserId={user.id}
      myPosition={myPosition}
      myEntry={myEntry ?? { score: 0, tickets: 0, eligible: true }}
    />
  )
}
