import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChallengesView } from './ChallengesView'
import { CHALLENGE_TEMPLATES } from '@/lib/challenges'
import { trustLevel } from '@/lib/trust'
import type { RangIdentity } from '@/types/vida'

export const dynamic = 'force-dynamic'

export default async function ChallengesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, rang')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const [
    { data: challenges },
    { data: payouts },
    { data: trustRow },
  ] = await Promise.all([
    supabase
      .from('challenges_stake')
      .select('id, template_slug, duration_days, stake_amount_eur, reward_target_eur, status, start_date, end_date, proofs_done, proofs_required, trust_score_at_start, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('challenge_payouts')
      .select('id, challenge_id, outcome, stake_returned_eur, reward_won_eur, trust_delta, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('trust_scores')
      .select('score')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const trustScore = trustRow?.score ?? 50
  const trust = trustLevel(trustScore)
  const rang = (profile?.rang ?? 'explorateur') as RangIdentity

  return (
    <ChallengesView
      templates={CHALLENGE_TEMPLATES}
      challenges={challenges ?? []}
      payouts={payouts ?? []}
      trustScore={trustScore}
      trustLevel={trust.level}
      trustLabel={trust.label}
      rang={rang}
    />
  )
}
