import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeScoreHumanite, rangFromScore } from '@/lib/score-humanite'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Charge profil + ancienneté
  const { data: profile } = await supabase
    .from('profiles')
    .select('anciennete_months, streak_days, score_humanite, rang, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: 'Profil manquant' }, { status: 404 })

  // Compte trajets propres validés 30j (placeholder — table P3)
  const trajets_propres_30j = 0

  // Compte missions validées 30j (placeholder — table P7)
  const missions_done_30j = 0

  // Filleuls actifs
  const { count: parrainagesActifs } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('status', 'active')

  // Partages 30j (placeholder — table P12)
  const partages_30j = 0

  // Calcule ancienneté à partir created_at si pas mis à jour côté DB
  const created = profile.created_at ? new Date(profile.created_at) : new Date()
  const monthsSince = Math.floor((Date.now() - created.getTime()) / (30 * 24 * 3600 * 1000))
  const anciennete_months = Math.max(profile.anciennete_months ?? 0, monthsSince)

  const score = computeScoreHumanite({
    trajets_propres_30j,
    missions_done_30j,
    parrainages_actifs: parrainagesActifs ?? 0,
    partages_30j,
    streak_days: profile.streak_days ?? 0,
    anciennete_months,
  })

  const rang = rangFromScore(score.total)

  // Persiste
  await supabase
    .from('profiles')
    .update({ score_humanite: score.total, rang, anciennete_months })
    .eq('id', user.id)

  await supabase.from('score_humanite_history').insert({
    user_id: user.id,
    score: score.total,
    breakdown: score.breakdown,
  })

  return NextResponse.json({
    total: score.total,
    rang,
    breakdown: score.breakdown,
    anciennete_months,
  })
}
