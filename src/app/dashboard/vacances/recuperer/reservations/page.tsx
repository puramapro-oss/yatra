import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ReservationsView } from './ReservationsView'

export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let reservations = []
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/reservations`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) reservations = (await r.json()).reservations ?? []
  } catch {
    reservations = []
  }

  return <ReservationsView initialReservations={reservations} />
}
