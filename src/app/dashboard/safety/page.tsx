import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SafetyView } from './SafetyView'
import { trustLevel } from '@/lib/trust'

export const dynamic = 'force-dynamic'

export default async function SafetyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, ville_principale')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const [{ data: myReports }, { data: trustRow }] = await Promise.all([
    supabase
      .from('safety_reports')
      .select('id, category, severity, lat, lon, description, status, created_at, expires_at')
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

  return (
    <SafetyView
      myReports={myReports ?? []}
      trustScore={trustScore}
      trustLabel={trust.label}
    />
  )
}
