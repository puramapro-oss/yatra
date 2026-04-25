import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChallengeDetailView } from './ChallengeDetailView'
import { computeProgress, findTemplate } from '@/lib/challenges'

export const dynamic = 'force-dynamic'

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: challenge } = await supabase
    .from('challenges_stake')
    .select('id, template_slug, duration_days, stake_amount_eur, reward_target_eur, status, start_date, end_date, proofs_done, proofs_required, trust_score_at_start, jackpot_eur, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!challenge) notFound()

  const [{ data: days }, { data: payout }] = await Promise.all([
    supabase
      .from('challenge_days')
      .select('id, day_index, day_date, proof_type, proof_value, validated, validated_at, fraud_score')
      .eq('challenge_id', id)
      .order('day_index', { ascending: true }),
    supabase
      .from('challenge_payouts')
      .select('id, outcome, stake_returned_eur, reward_won_eur, jackpot_won_eur, trust_delta, created_at')
      .eq('challenge_id', id)
      .maybeSingle(),
  ])

  const tpl = findTemplate(challenge.template_slug) ?? null
  const progress = computeProgress({
    proofs_done: challenge.proofs_done,
    proofs_required: challenge.proofs_required,
    start_date: challenge.start_date,
    end_date: challenge.end_date,
  })

  return (
    <ChallengeDetailView
      challenge={challenge}
      template={tpl}
      days={days ?? []}
      payout={payout ?? null}
      progress={progress}
    />
  )
}
