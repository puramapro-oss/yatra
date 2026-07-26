import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { RepositionnementView } from './RepositionnementView'
import { CANAUX_REPOSITIONNEMENT, CROISIERES_DERNIERE_MINUTE, VOLS_REPOSITIONNEMENT } from '@/lib/vacances/repositionnement'

export const dynamic = 'force-dynamic'

export default async function RepositionnementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let usages = []
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/repositionnement`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) usages = (await r.json()).usages ?? []
  } catch {
    usages = []
  }

  return (
    <RepositionnementView
      initialUsages={usages}
      canaux={CANAUX_REPOSITIONNEMENT}
      croisieres={CROISIERES_DERNIERE_MINUTE}
      volsRepositionnement={VOLS_REPOSITIONNEMENT}
    />
  )
}
