import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ImmersionView } from './ImmersionView'

export const dynamic = 'force-dynamic'

export default async function AmbianceImmersionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mode } = await supabase
    .from('ambient_modes')
    .select('id, slug, name, tagline, description, carrier_hz, beat_hz, beat_band, primary_color, secondary_color, emoji')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (!mode) notFound()

  const { data: prefs } = await supabase
    .from('user_ambient_preferences')
    .select('default_volume, binaural_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <ImmersionView
      mode={mode}
      defaultVolume={prefs?.default_volume ?? 0.4}
      defaultBinauralEnabled={prefs?.binaural_enabled ?? true}
    />
  )
}
