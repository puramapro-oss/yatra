import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrajetPlanner } from './TrajetPlanner'

export const dynamic = 'force-dynamic'

export default async function TrajetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, ville_principale, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  return <TrajetPlanner email={user.email!} villePrincipale={profile?.ville_principale ?? null} />
}
