import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rankAidesForProfile, type MatchProfile, type Aide } from '@/lib/aides-matcher'
import type { MobilityMode } from '@/types/vida'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const minScore = Math.max(Number(url.searchParams.get('min_score') ?? 30), 0)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 30), 100)

    // Profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('pays_principal, ville_principale, anciennete_months')
      .eq('id', user.id)
      .maybeSingle()

    const { data: vida } = await supabase
      .from('vida_core_profile')
      .select('univers_personnel')
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: adn } = await supabase
      .from('adn_mobilite')
      .select('rythme_appris, modes_preferes')
      .eq('user_id', user.id)
      .maybeSingle()

    const universPersonnel = (vida?.univers_personnel ?? {}) as Record<string, unknown>
    const situations: string[] = Array.isArray(universPersonnel.situations)
      ? (universPersonnel.situations as string[])
      : []
    const age = typeof universPersonnel.age === 'number' ? (universPersonnel.age as number) : null

    const rythme = (adn?.rythme_appris ?? {}) as { mode_dominant?: MobilityMode }
    const modes_preferes = (adn?.modes_preferes ?? []) as MobilityMode[]
    const transport_modes = [
      ...(rythme.mode_dominant ? [rythme.mode_dominant] : []),
      ...modes_preferes.filter((m) => m !== rythme.mode_dominant),
    ]

    // Région à partir ville (mapping minimal) ; sinon FR
    const ville = (profile?.ville_principale ?? '').toLowerCase()
    const region = guessRegionFromVille(ville)

    const matchProfile: MatchProfile = {
      pays: profile?.pays_principal ?? 'FR',
      region,
      age,
      situations: situations.length > 0 ? situations : ['salarie'], // fallback raisonnable
      transport_modes,
    }

    // Liste aides actives (filtre catégorie si spécifié)
    let q = supabase
      .from('aides')
      .select('id, slug, nom, category, type_aide, region, montant_max, url_officielle, source_url, source_type, description, situation_eligible, transport_modes_eligible, profil_eligible, age_min, age_max, handicap_only, active')
      .eq('active', true)

    if (category) q = q.eq('category', category)

    const { data: aides, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Ranking
    const ranked = rankAidesForProfile((aides ?? []) as Aide[], matchProfile)
    const topMatches = ranked.filter((m) => m.score >= minScore).slice(0, limit)

    // Hydrate avec data complete
    const aideMap = new Map((aides ?? []).map((a) => [a.id, a]))
    const matched = topMatches
      .map((m) => {
        const a = aideMap.get(m.aide_id)
        if (!a) return null
        return { ...a, _score: m.score, _reasons: m.reasons }
      })
      .filter(Boolean)

    // Subscriptions de l'user (pour marquer follow)
    const { data: subs } = await supabase
      .from('aides_subscriptions')
      .select('aide_id, status')
      .eq('user_id', user.id)
      .in('status', ['following', 'applied', 'received'])

    const followedSet = new Set((subs ?? []).map((s) => s.aide_id))
    const enriched = matched.map((m) => ({ ...m, _followed: followedSet.has((m as { id: string }).id) }))

    return NextResponse.json({
      profile_used: { region, situations: matchProfile.situations, age, transport_modes },
      total: enriched.length,
      aides: enriched,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function guessRegionFromVille(ville: string): string {
  // Mapping non-exhaustif. P11 sourced via INSEE Code Officiel.
  if (!ville) return 'FR'
  if (/(paris|versailles|nanterre|saint-denis|boulogne|argenteuil|montreuil)/i.test(ville)) return 'IDF'
  if (/(lyon|villeurbanne|grenoble|saint-etienne|chamb[ée]ry|clermont)/i.test(ville)) return 'AURA'
  if (/(toulouse|montpellier|n[îi]mes|perpignan|albi)/i.test(ville)) return 'OCC'
  if (/(marseille|nice|aix|toulon|avignon|cannes)/i.test(ville)) return 'PACA'
  if (/(bordeaux|p[ao]u|bayonne|limoges|biarritz|p[ée]rigueux)/i.test(ville)) return 'NAQ'
  if (/(nantes|rennes|brest|angers|le mans|saint-nazaire)/i.test(ville)) return 'PDL'
  if (/(lille|amiens|dunkerque|tourcoing|roubaix)/i.test(ville)) return 'HDF'
  if (/(strasbourg|metz|nancy|reims|mulhouse|colmar)/i.test(ville)) return 'GE'
  return 'FR'
}
