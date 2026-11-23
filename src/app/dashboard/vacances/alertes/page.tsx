import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { readAlerts } from '@/lib/vacances/alertes-data'
import type { AlertsData } from '@/lib/vacances/alertes-types'
import { AlertesView } from './AlertesView'

export const dynamic = 'force-dynamic'

export default async function VacancesAlertesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/vacances/alertes')

  let data: AlertsData = { configs: [], notifications: [] }
  let initialError: string | null = null
  try {
    data = await readAlerts(supabase, user.id)
  } catch {
    initialError = 'Tes alertes sont momentanément indisponibles. Actualise pour réessayer.'
  }

  return <AlertesView initialConfigs={data.configs} initialNotifications={data.notifications} initialError={initialError} />
}
