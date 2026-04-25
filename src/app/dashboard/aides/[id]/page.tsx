import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AideDetailView } from './AideDetailView'

export const dynamic = 'force-dynamic'

export default async function AideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const cookieHeader = h.get('cookie') ?? ''

  const r = await fetch(`${proto}://${host}/api/aides/${encodeURIComponent(id)}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  })
  if (!r.ok) notFound()
  const data = await r.json()
  if (!data.aide) notFound()

  return <AideDetailView aide={data.aide} subscription={data.subscription} />
}
