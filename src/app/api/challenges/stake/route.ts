import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { findTemplate, validateStakeParams } from '@/lib/challenges'
import { rangMultiplier } from '@/lib/rangs'
import type { RangIdentity } from '@/types/vida'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET — liste des challenges actifs + complétés (50 derniers)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: challenges, error } = await supabase
    .from('challenges_stake')
    .select('id, template_slug, duration_days, stake_amount_eur, reward_target_eur, status, start_date, end_date, proofs_done, proofs_required, trust_score_at_start, jackpot_eur, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Erreur lecture challenges' }, { status: 500 })
  }

  const { data: payouts } = await supabase
    .from('challenge_payouts')
    .select('id, challenge_id, outcome, stake_returned_eur, reward_won_eur, jackpot_won_eur, trust_delta, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    challenges: challenges ?? [],
    payouts: payouts ?? [],
  })
}

// POST — démarrer un nouveau challenge
const startSchema = z.object({
  template_slug: z.string().min(1),
  stake_amount_eur: z.number().min(5).max(200),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = startSchema.parse(body)

    const validation = validateStakeParams({
      templateSlug: data.template_slug,
      stake_amount_eur: data.stake_amount_eur,
    })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const tpl = validation.template

    // Cap stake selon rang user
    const { data: profile } = await supabase
      .from('profiles')
      .select('rang')
      .eq('id', user.id)
      .maybeSingle()
    const rang = (profile?.rang ?? 'explorateur') as RangIdentity
    const rangCap =
      rang === 'legende' ? 200 :
      rang === 'regenerateur' ? 100 :
      rang === 'gardien' ? 50 : 25

    if (data.stake_amount_eur > rangCap) {
      return NextResponse.json(
        { error: `Mise max ${rangCap}€ pour ton rang actuel (${rang}). Monte de rang pour staker plus.` },
        { status: 403 },
      )
    }

    // Reward bonus avec multiplicateur rang
    const reward_target_eur = Math.round(tpl.reward_target_eur * rangMultiplier(rang) * 100) / 100

    // RPC atomique
    const { data: result, error: rpcErr } = await supabase.rpc('start_challenge_stake_v1' as never, {
      p_user_id: user.id,
      p_template_slug: tpl.slug,
      p_duration_days: tpl.duration_days,
      p_stake_amount_eur: data.stake_amount_eur,
      p_reward_target_eur: reward_target_eur,
      p_proof_type: tpl.proof_type,
      p_proofs_required: tpl.proofs_required,
    } as never)

    if (rpcErr) {
      const msg = rpcErr.message
      if (msg.includes('trust_too_low')) {
        return NextResponse.json({ error: 'Trust Score insuffisant. Seuil : 30/100' }, { status: 403 })
      }
      if (msg.includes('already_active')) {
        return NextResponse.json({ error: 'Tu as déjà un challenge actif. Termine-le avant d\'en démarrer un autre.' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({
      challenge: result,
      template: { slug: tpl.slug, title: tpl.title, emoji: tpl.emoji },
      reward_target_eur,
    }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
