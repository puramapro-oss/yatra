import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupCreateForm } from './GroupCreateForm'

export const dynamic = 'force-dynamic'

export default async function CreateGroupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('ville_principale, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  return <GroupCreateForm defaultCity={profile?.ville_principale ?? ''} />
}
