import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ScannerView } from './ScannerView'
import type { FeeSchedule, AirportTransfer } from '@/lib/vacances/true-price'

export const dynamic = 'force-dynamic'

export default async function VacancesScannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let transporteurs: FeeSchedule[] = []
  let aeroports: AirportTransfer[] = []
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/true-price`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    if (r.ok) {
      const data = await r.json()
      transporteurs = data.transporteurs ?? []
      aeroports = data.aeroports ?? []
    }
  } catch {
    transporteurs = []
    aeroports = []
  }

  return <ScannerView transporteurs={transporteurs} aeroports={aeroports} />
}
