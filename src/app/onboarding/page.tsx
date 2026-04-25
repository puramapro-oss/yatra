import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from './OnboardingFlow'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/onboarding')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, ville_principale, pays_principal, ambiance_preferee, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_completed) redirect('/dashboard')

  // Fil de Vie : event onboarding_started (idempotent — RLS check duplicates)
  await supabase
    .from('fil_de_vie')
    .insert({
      user_id: user.id,
      app_slug: 'yatra',
      event_type: 'onboarding_started',
      payload: {},
      irreversible: true,
    })
    .then(() => null, () => null)

  return (
    <OnboardingFlow
      defaultName={profile?.full_name ?? user.user_metadata?.full_name ?? ''}
      defaultVille={profile?.ville_principale ?? ''}
    />
  )
}
