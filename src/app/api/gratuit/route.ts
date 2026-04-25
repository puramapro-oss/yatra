import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rankGratuit, type GratuitEvent } from '@/lib/gratuit-matcher'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 30), 100)

    const { data: profile } = await supabase
      .from('profiles')
      .select('ville_principale, pays_principal')
      .eq('id', user.id)
      .maybeSingle()

    const villePrincipale = profile?.ville_principale ?? 'Paris'
    const region = guessRegion(villePrincipale)

    let q = supabase.from('gratuit_events').select('*').eq('active', true)
    if (category) q = q.eq('category', category)
    const { data: events, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const ranked = rankGratuit((events ?? []) as GratuitEvent[], {
      userCity: villePrincipale,
      userRegion: region,
    }).slice(0, limit)

    return NextResponse.json({
      city: villePrincipale,
      region,
      total: ranked.length,
      events: ranked,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function guessRegion(ville: string): string {
  const v = (ville ?? '').toLowerCase()
  if (/(paris|versailles|nanterre|saint-denis|boulogne|montreuil|argenteuil)/i.test(v)) return 'IDF'
  if (/(lyon|villeurbanne|grenoble|saint-etienne|chamb[ée]ry)/i.test(v)) return 'AURA'
  if (/(toulouse|montpellier|n[îi]mes|perpignan|albi)/i.test(v)) return 'OCC'
  if (/(marseille|nice|aix|toulon|avignon|cannes)/i.test(v)) return 'PACA'
  if (/(bordeaux|p[ao]u|bayonne|limoges)/i.test(v)) return 'NAQ'
  if (/(nantes|rennes|brest|angers)/i.test(v)) return 'PDL'
  if (/(lille|amiens|dunkerque)/i.test(v)) return 'HDF'
  if (/(strasbourg|metz|nancy|reims|mulhouse)/i.test(v)) return 'GE'
  return 'FR'
}
