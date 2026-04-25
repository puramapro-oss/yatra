import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rankMissions, type HumanitarianMission } from '@/lib/humanitarian-matcher'
import { HumanitaireView } from './HumanitaireView'

export const dynamic = 'force-dynamic'

export default async function HumanitairePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('age, ville_principale, region_principale, situations, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: missions } = await supabase
    .from('humanitarian_missions')
    .select('id, slug, title, ngo_name, ngo_url, cause, destination_city, destination_country, description, duration_days, starts_at, ends_at, spots_total, spots_taken, cost_eur, transport_discount_pct, required_age_min, prerequisites, contact_email')
    .eq('active', true)

  const ranked = rankMissions((missions ?? []) as HumanitarianMission[], {
    age: profile?.age ?? null,
    ville_principale: profile?.ville_principale ?? null,
    region: profile?.region_principale ?? null,
    situations: profile?.situations ?? [],
  })

  const { data: applications } = await supabase
    .from('humanitarian_applications')
    .select('id, mission_id, status, applied_at')
    .eq('user_id', user.id)

  return <HumanitaireView matches={ranked} applications={applications ?? []} />
}
