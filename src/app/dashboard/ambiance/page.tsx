import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AmbianceGalleryView } from './AmbianceGalleryView'

export const dynamic = 'force-dynamic'

export default async function AmbiancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const [{ data: modes }, { data: prefs }] = await Promise.all([
    supabase
      .from('ambient_modes')
      .select('id, slug, name, tagline, description, carrier_hz, beat_hz, beat_band, primary_color, secondary_color, ideal_time_of_day, ideal_trip_mode, emoji, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('user_ambient_preferences')
      .select('last_mode_slug, default_volume, binaural_enabled, total_minutes_listened')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  return <AmbianceGalleryView modes={modes ?? []} prefs={prefs ?? null} />
}
