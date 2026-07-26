import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { VacancesHubView } from './VacancesHubView'

export const dynamic = 'force-dynamic'

export default async function VacancesHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let totalEur = 0
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/impact`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) totalEur = (await r.json()).total_eur ?? 0
  } catch {
    totalEur = 0
  }

  return <VacancesHubView totalEur={totalEur} />
}
