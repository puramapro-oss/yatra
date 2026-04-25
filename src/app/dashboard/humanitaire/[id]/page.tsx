import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MissionDetailView } from './MissionDetailView'

export const dynamic = 'force-dynamic'

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isUuid = UUID_RX.test(id)
  const { data: mission } = await supabase
    .from('humanitarian_missions')
    .select('*')
    .eq(isUuid ? 'id' : 'slug', id)
    .eq('active', true)
    .maybeSingle()

  if (!mission) notFound()

  const { data: application } = await supabase
    .from('humanitarian_applications')
    .select('id, status, applied_at, motivation')
    .eq('user_id', user.id)
    .eq('mission_id', mission.id)
    .maybeSingle()

  return (
    <MissionDetailView
      mission={mission}
      application={application ?? null}
      spotsLeft={mission.spots_total - mission.spots_taken}
    />
  )
}
