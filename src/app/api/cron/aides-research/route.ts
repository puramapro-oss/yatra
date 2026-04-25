/**
 * CRON quotidien Tavily — veille aides FR.
 *
 * Sécurité : Bearer token CRON_SECRET (env), à configurer dans Vercel + n8n.
 * Stratégie : 1 query large + déduplication par URL/slug.
 *
 * À déclencher :
 * - Vercel Cron (vercel.json schedule "0 6 * * *")
 * - ou n8n daily 6h
 * - ou manuellement par admin via /api/aides/admin/research
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { tavilySearch } from '@/lib/tavily'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const RESEARCH_QUERIES = [
  'nouvelles aides transport mobilité durable France 2026',
  'subvention vélo électrique 2026 France',
  'prime covoiturage transport 2026 ville France',
  'aide étudiant transport carte abonnement 2026',
  'aide handicap mobilité MDPH 2026',
]

const TRUSTED_DOMAINS = [
  'service-public.fr',
  'gouv.fr',
  'ameli.fr',
  'caf.fr',
  'francetravail.fr',
  'iledefrance.fr',
  'sncf-connect.com',
  'actionlogement.fr',
  'etudiant.gouv.fr',
  'fonction-publique.gouv.fr',
]

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const auth = request.headers.get('authorization') ?? ''
  // Vercel Cron: "Bearer <CRON_SECRET>". n8n peut utiliser le même format.
  return auth === `Bearer ${expected}`
}

export async function GET(request: Request) {
  return runResearch(request)
}

export async function POST(request: Request) {
  return runResearch(request)
}

async function runResearch(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const startedAt = new Date().toISOString()
  const results: { query: string; new_findings: number }[] = []
  let totalInserted = 0

  for (const query of RESEARCH_QUERIES) {
    try {
      const data = await tavilySearch(query, {
        topic: 'news',
        max_results: 8,
        search_depth: 'basic',
        include_domains: TRUSTED_DOMAINS,
        days: 30,
      })

      let newCount = 0
      for (const r of data.results) {
        const slug = makeSlug(r.title)
        // Vérifier si slug existe déjà
        const { data: existing } = await supabase
          .from('aides')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        if (existing) continue

        const { error } = await supabase.from('aides').insert({
          slug,
          nom: r.title.slice(0, 200),
          category: guessCategory(r.title + ' ' + r.content),
          type_aide: 'aide',
          region: guessRegion(r.title + ' ' + r.content),
          montant_max: extractAmount(r.content),
          url_officielle: r.url,
          source_url: r.url,
          source_type: 'tavily',
          description: r.content.slice(0, 500),
          situation_eligible: [],
          transport_modes_eligible: [],
          profil_eligible: ['adulte'],
          active: true,
          last_verified_at: new Date().toISOString(),
          body_jsonb: { tavily_score: r.score, published_date: r.published_date ?? null },
        })
        if (!error) newCount++
      }

      totalInserted += newCount
      results.push({ query, new_findings: newCount })
    } catch (e) {
      results.push({ query, new_findings: -1 })
      const reason = e instanceof Error ? e.message : 'unknown'
      await supabase.from('admin_logs').insert({
        action: 'tavily_search_failed',
        target_type: 'aides',
        details: { query, reason },
      })
    }
  }

  await supabase.from('admin_logs').insert({
    action: 'aides_research_run',
    target_type: 'aides',
    details: {
      started_at: startedAt,
      results,
      total_inserted: totalInserted,
    },
  })

  return NextResponse.json({ ok: true, started_at: startedAt, total_inserted: totalInserted, by_query: results })
}

function makeSlug(s: string): string {
  return (
    'tavily-' +
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80)
  )
}

function guessCategory(text: string): string {
  const t = text.toLowerCase()
  if (/v[ée]lo|covoiturage|trottinette|train|transport|navigo|sncf|tcl|ratp|mobilit/i.test(t)) return 'transport'
  if (/[ée]nergie|chauffage|chaudi[èe]re|isolation|ma\s?prime/i.test(t)) return 'energie'
  if (/logement|loyer|apl|caf|loca-pass/i.test(t)) return 'logement'
  if (/handicap|aah|mdph|rqth|cmi/i.test(t)) return 'mobilite_handicap'
  if (/sant[ée]|cmu|css|m[ée]dical/i.test(t)) return 'sante'
  return 'social'
}

function guessRegion(text: string): string {
  const t = text.toLowerCase()
  if (/le-de-france|idf|paris|navigo|ratp/i.test(t)) return 'IDF'
  if (/lyon|aura|auvergne|rh[ôo]ne|grenoble/i.test(t)) return 'AURA'
  if (/toulouse|montpellier|occitanie/i.test(t)) return 'OCC'
  if (/marseille|paca|provence|c[ôo]te d'azur/i.test(t)) return 'PACA'
  if (/bordeaux|nouvelle.?aquitaine/i.test(t)) return 'NAQ'
  if (/nantes|loire/i.test(t)) return 'PDL'
  return 'FR'
}

function extractAmount(text: string): number | null {
  // Cherche €, EUR, "1500 €", "1 500 €"
  const m = text.match(/(\d{1,3}(?:[\s.]\d{3})*|\d+)\s*€/i)
  if (!m) return null
  const num = Number(m[1].replace(/[\s.]/g, ''))
  if (Number.isFinite(num) && num > 0 && num < 100000) return num
  return null
}
