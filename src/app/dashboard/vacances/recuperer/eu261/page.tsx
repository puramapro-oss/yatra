import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Eu261View } from './Eu261View'

export const dynamic = 'force-dynamic'

export default async function Eu261Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let reclamations = []
  let aeroports = []
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/eu261`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      reclamations = data.reclamations ?? []
      aeroports = data.aeroports ?? []
    }
  } catch {
    reclamations = []
    aeroports = []
  }

  return <Eu261View initialReclamations={reclamations} aeroports={aeroports} nomComplet={user.user_metadata?.full_name ?? ''} />
}
