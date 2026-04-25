import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeProgress, findTemplate } from '@/lib/challenges'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: challenge, error } = await supabase
    .from('challenges_stake')
    .select('id, template_slug, duration_days, stake_amount_eur, reward_target_eur, status, start_date, end_date, proofs_done, proofs_required, trust_score_at_start, jackpot_eur, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !challenge) {
    return NextResponse.json({ error: 'Challenge introuvable' }, { status: 404 })
  }

  const { data: days } = await supabase
    .from('challenge_days')
    .select('id, day_index, day_date, proof_type, proof_value, validated, validated_at, fraud_score')
    .eq('challenge_id', id)
    .order('day_index', { ascending: true })

  const { data: payout } = await supabase
    .from('challenge_payouts')
    .select('id, outcome, stake_returned_eur, reward_won_eur, jackpot_won_eur, trust_delta, created_at')
    .eq('challenge_id', id)
    .maybeSingle()

  const tpl = findTemplate(challenge.template_slug)

  const progress = computeProgress({
    proofs_done: challenge.proofs_done,
    proofs_required: challenge.proofs_required,
    start_date: challenge.start_date,
    end_date: challenge.end_date,
  })

  return NextResponse.json({
    challenge,
    template: tpl ?? null,
    days: days ?? [],
    payout: payout ?? null,
    progress,
  })
}
