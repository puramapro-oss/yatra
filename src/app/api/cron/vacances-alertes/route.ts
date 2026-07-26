/**
 * CRON quotidien Tavily — veille bons plans / erreurs de tarif voyages (VACANCES V2.0 §1).
 * Même pattern que api/cron/aides-research : recherche web réelle, dédup par URL,
 * jamais un prix inventé. Sécurité : Bearer CRON_SECRET (cf vercel.json).
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { tavilySearch } from '@/lib/tavily'
import { extractPriceEur, dealMatchesConfig } from '@/lib/vacances/alertes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}

async function runVeille(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createServiceClient()

  const [{ data: destinationsCatalogue }, { data: configsActifs }] = await Promise.all([
    supabase.from('vacances_destinations').select('nom').eq('active', true),
    supabase.from('vacances_alert_configs').select('*').eq('actif', true),
  ])

  const destinationsUniques = Array.from(
    new Set([
      ...(destinationsCatalogue ?? []).map((d) => d.nom),
      ...((configsActifs ?? []).map((c) => c.destination_souhaitee)),
    ]),
  ).slice(0, 15)

  const startedAt = new Date().toISOString()
  const results: { destination: string; deals_found: number }[] = []
  let totalInserted = 0
  let totalNotified = 0

  for (const destination of destinationsUniques) {
    try {
      const data = await tavilySearch(`erreur de tarif OR bon plan vol pas cher ${destination} France`, {
        topic: 'news',
        max_results: 5,
        search_depth: 'basic',
        days: 14,
      })

      let dealsFound = 0
      for (const r of data.results) {
        const { data: existing } = await supabase.from('vacances_deals_found').select('id').eq('url', r.url).maybeSingle()
        if (existing) continue

        const { data: inserted, error } = await supabase
          .from('vacances_deals_found')
          .insert({
            titre: r.title.slice(0, 300),
            url: r.url,
            extrait: r.content.slice(0, 500),
            prix_detecte_eur: extractPriceEur(r.content) ?? extractPriceEur(r.title),
            destination_matched: destination,
            source_score: r.score,
            published_date: r.published_date ?? null,
          })
          .select()
          .single()
        if (error || !inserted) continue
        dealsFound++
        totalInserted++

        for (const config of configsActifs ?? []) {
          if (!dealMatchesConfig(inserted, config)) continue
          const { error: notifError } = await supabase.from('vacances_alert_notifications').insert({
            user_id: config.user_id,
            config_id: config.id,
            deal_id: inserted.id,
          })
          if (!notifError) totalNotified++
        }
      }
      results.push({ destination, deals_found: dealsFound })
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'unknown'
      await supabase.from('admin_logs').insert({
        action: 'vacances_alertes_tavily_failed',
        target_type: 'vacances_deals_found',
        details: { destination, reason },
      })
    }
  }

  await supabase.from('admin_logs').insert({
    action: 'vacances_alertes_run',
    target_type: 'vacances_deals_found',
    details: { started_at: startedAt, results, total_inserted: totalInserted, total_notified: totalNotified },
  })

  return NextResponse.json({ ok: true, total_inserted: totalInserted, total_notified: totalNotified, by_destination: results })
}

export async function GET(request: Request) {
  return runVeille(request)
}

export async function POST(request: Request) {
  return runVeille(request)
}
