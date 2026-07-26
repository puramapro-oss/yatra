import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AlertesView } from './AlertesView'

export const dynamic = 'force-dynamic'

export default async function VacancesAlertesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let configs = []
  let notifications = []
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/alertes`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      configs = data.configs ?? []
      notifications = data.notifications ?? []
    }
  } catch {
    configs = []
    notifications = []
  }

  return <AlertesView initialConfigs={configs} initialNotifications={notifications} />
}
