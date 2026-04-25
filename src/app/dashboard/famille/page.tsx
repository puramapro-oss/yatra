import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FamilleView } from './FamilleView'

export const dynamic = 'force-dynamic'

export default async function FamillePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    return <FamilleView family={null} members={[]} cumul={null} myUserId={user.id} myRole={null} />
  }

  const [{ data: family }, { data: members }] = await Promise.all([
    supabase
      .from('families')
      .select('id, owner_id, name, invite_code, max_members, created_at')
      .eq('id', membership.family_id)
      .maybeSingle(),
    supabase
      .from('family_members')
      .select('user_id, role, joined_at, profiles!inner(full_name, score_humanite, anciennete_months)')
      .eq('family_id', membership.family_id)
      .order('joined_at', { ascending: true }),
  ])

  // Cumul km vélo
  const memberIds = (members ?? []).map((m) => m.user_id)
  let totalKm = 0
  let scoreSum = 0
  if (memberIds.length > 0) {
    const { data: trips } = await supabase
      .from('trips')
      .select('user_id, distance_km, mode_dominant')
      .in('user_id', memberIds)
      .eq('flagged_fraud', false)
    for (const t of trips ?? []) {
      if (t.mode_dominant === 'velo' || t.mode_dominant === 'marche') {
        totalKm += Number(t.distance_km ?? 0)
      }
    }
    for (const m of members ?? []) {
      const profileLite = m.profiles as unknown as { score_humanite?: number | null }
      scoreSum += Number(profileLite?.score_humanite ?? 0)
    }
  }

  return (
    <FamilleView
      family={family ?? null}
      members={members ?? []}
      cumul={{
        km_clean: Number(totalKm.toFixed(2)),
        score_avg: members && members.length > 0 ? Number((scoreSum / members.length).toFixed(2)) : 0,
      }}
      myUserId={user.id}
      myRole={membership.role}
    />
  )
}
