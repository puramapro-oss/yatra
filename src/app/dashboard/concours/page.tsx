import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConcoursView } from './ConcoursView'

export const dynamic = 'force-dynamic'

export default async function ConcoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: results } = await supabase
    .from('contests_results')
    .select('id, type, period_start, period_end, total_pool_eur, winners, total_distributed_eur, created_at')
    .eq('status', 'completed')
    .order('period_end', { ascending: false })
    .limit(20)

  const { data: pools } = await supabase
    .from('pool_balances')
    .select('pool_type, balance_eur')

  return (
    <ConcoursView
      results={results ?? []}
      pools={pools ?? []}
      myUserId={user.id}
    />
  )
}
