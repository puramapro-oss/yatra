import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AidesView } from './AidesView'

export const dynamic = 'force-dynamic'

type EnrichedAide = {
  id: string
  slug: string | null
  nom: string
  category: string | null
  region: string | null
  montant_max: number | null
  url_officielle: string | null
  source_url: string | null
  source_type: string | null
  description: string | null
  type_aide: string | null
  active: boolean
  _score: number
  _reasons: string[]
  _followed: boolean
}

export default async function AidesListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, ville_principale, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  // Fetch via notre API interne (server-side)
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('host')
  const apiUrl = `${proto}://${host}/api/aides?limit=30&min_score=20`

  let aides: EnrichedAide[] = []
  let profileUsed: { region?: string; situations?: string[]; age?: number | null; transport_modes?: string[] } = {}
  try {
    const cookieHeader = h.get('cookie') ?? ''
    const r = await fetch(apiUrl, { headers: { cookie: cookieHeader }, cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      aides = data.aides ?? []
      profileUsed = data.profile_used ?? {}
    }
  } catch {
    aides = []
  }

  return <AidesView aides={aides} profileUsed={profileUsed} villePrincipale={profile?.ville_principale ?? null} />
}
