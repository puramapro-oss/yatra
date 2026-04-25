import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHello } from './DashboardHello'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, score_humanite, anciennete_months, ville_principale, awakening_level, intro_seen, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, vida_credits, total_earned')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <DashboardHello
      email={user.email!}
      profile={profile}
      wallet={wallet}
    />
  )
}
