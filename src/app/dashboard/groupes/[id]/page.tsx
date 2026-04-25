import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupDetailView } from './GroupDetailView'

export const dynamic = 'force-dynamic'

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('group_purchases')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!group) notFound()

  const { data: membership } = await supabase
    .from('group_purchase_members')
    .select('id, joined_at')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return <GroupDetailView group={group} userId={user.id} membership={membership} />
}
