import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * CRON RGPD : purge des conversations Aria clôturées >180 jours.
 * Auth = Bearer CRON_SECRET ou header Vercel `x-vercel-cron`.
 * Schedule = `0 4 * * 0` (dimanche 04:00 UTC, défini dans vercel.json).
 */
function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('authorization')
  if (auth && auth === `Bearer ${process.env.CRON_SECRET ?? ''}` && process.env.CRON_SECRET) {
    return true
  }
  // Vercel ajoute ce header pour les cron internes — équivaut à un signal de confiance
  if (request.headers.get('x-vercel-cron') === '1') return true
  return false
}

async function runCleanup() {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('cleanup_aria_old_v1' as never, {} as never)
  if (error) throw new Error(error.message)
  return data
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const result = await runCleanup()
    return NextResponse.json({ ok: true, result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const result = await runCleanup()
    return NextResponse.json({ ok: true, result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
