import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { tierFromEarnings } from '@/lib/ambassadeur'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('ambassadeur_profiles')
    .select('id, slug, bio, social_links, status, tier, total_clicks, total_signups, total_conversions, total_earnings_eur, free_plan_granted, kit_downloaded, approved_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ profile: null })
  }

  const computedTier = tierFromEarnings(Number(profile.total_earnings_eur ?? 0))

  // Ajuster tier si désynchronisé (lazy upgrade)
  if (computedTier !== profile.tier) {
    await supabase
      .from('ambassadeur_profiles')
      .update({ tier: computedTier })
      .eq('id', profile.id)
    profile.tier = computedTier
  }

  // Stats 30 derniers jours
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [{ count: clicks30d }, { count: conversions30d }, { data: lastConversions }] = await Promise.all([
    supabase
      .from('ambassadeur_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('ambassadeur_id', profile.id)
      .gte('created_at', since),
    supabase
      .from('ambassadeur_conversions')
      .select('id', { count: 'exact', head: true })
      .eq('ambassadeur_id', profile.id)
      .gte('created_at', since),
    supabase
      .from('ambassadeur_conversions')
      .select('id, event_type, amount_eur, commission_eur, commission_pct, paid_at, created_at')
      .eq('ambassadeur_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({
    profile,
    stats_30d: {
      clicks: clicks30d ?? 0,
      conversions: conversions30d ?? 0,
    },
    last_conversions: lastConversions ?? [],
  })
}
