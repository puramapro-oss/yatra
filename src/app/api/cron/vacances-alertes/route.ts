/** Daily sourced web watch. A detected amount is never a live booking guarantee. */
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { tavilySearch } from '@/lib/tavily'
import { createWatchStore } from '@/lib/vacances/alertes-store'
import { runAlertWatch } from '@/lib/vacances/alertes-watch'
import { targetQuery } from '@/lib/vacances/alertes-plan'

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
  if (!process.env.TAVILY_API_KEY) {
    return NextResponse.json({ ok: false, status: 'error', error: 'La source de veille est indisponible.' }, { status: 503 })
  }
  try {
    const supabase = createServiceClient()
    const report = await runAlertWatch({
      store: createWatchStore(supabase),
      search: (target, signal) => tavilySearch(targetQuery(target), {
        topic: 'news', max_results: 5, search_depth: 'basic', days: 14, signal,
      }),
    })
    const { error: logError } = await supabase.from('admin_logs').insert({
      action: 'vacances_alertes_run', target_type: 'vacances_deals_found', details: report,
    }).abortSignal(AbortSignal.timeout(3000))
    if (logError) {
      report.failures.push('log')
      if (report.status === 'ok') report.status = 'partial'
      report.ok = false
    }
    return NextResponse.json(report, { status: report.status === 'error' ? 503 : 200 })
  } catch {
    return NextResponse.json({
      ok: false, status: 'error', error: 'La veille n’a pas pu être exécutée. Réessaie plus tard.',
    }, { status: 503 })
  }
}

export async function GET(request: Request) {
  return runVeille(request)
}

export async function POST(request: Request) {
  return runVeille(request)
}
