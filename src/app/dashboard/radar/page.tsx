import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RadarView } from './RadarView'

export const dynamic = 'force-dynamic'

export default async function RadarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  return <RadarView />
}
