import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { CagnotteListView } from './CagnotteListView'

export const dynamic = 'force-dynamic'

export default async function CagnotteListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  let cagnottes = []
  try {
    const r = await fetch(`${proto}://${host}/api/vacances/cagnotte`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) cagnottes = (await r.json()).cagnottes ?? []
  } catch {
    cagnottes = []
  }

  return <CagnotteListView initialCagnottes={cagnottes} />
}
