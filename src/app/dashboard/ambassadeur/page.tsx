import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AmbassadeurView } from './AmbassadeurView'

export const dynamic = 'force-dynamic'

export default async function AmbassadeurPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: amb } = await supabase
    .from('ambassadeur_profiles')
    .select('id, slug, bio, social_links, status, tier, total_clicks, total_signups, total_conversions, total_earnings_eur, free_plan_granted, kit_downloaded, approved_at, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  let lastConversions: Array<{
    id: string
    event_type: string
    amount_eur: number
    commission_eur: number
    paid_at: string | null
    created_at: string
  }> = []
  if (amb) {
    const { data: convs } = await supabase
      .from('ambassadeur_conversions')
      .select('id, event_type, amount_eur, commission_eur, paid_at, created_at')
      .eq('ambassadeur_id', amb.id)
      .order('created_at', { ascending: false })
      .limit(20)
    lastConversions = convs ?? []
  }

  return (
    <AmbassadeurView
      ambassadeur={amb ?? null}
      lastConversions={lastConversions}
      userFullName={profile?.full_name ?? null}
    />
  )
}
