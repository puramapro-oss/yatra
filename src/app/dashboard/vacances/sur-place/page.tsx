import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SurPlaceView } from './SurPlaceView'

export const dynamic = 'force-dynamic'

export default async function SurPlacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let villesTransportGratuit = []
  let repasAntiGaspi = null
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/sur-place`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      villesTransportGratuit = data.villes_transport_gratuit ?? []
      repasAntiGaspi = data.repas_anti_gaspi ?? null
    }
  } catch {
    villesTransportGratuit = []
  }

  return <SurPlaceView villesTransportGratuit={villesTransportGratuit} repasAntiGaspi={repasAntiGaspi} />
}
