/**
 * Admin trigger manuel veille Tavily — réservé super-admin.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isSuperAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Délègue au CRON endpoint (avec le secret) — exécution synchrone
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
    }

    const proto = process.env.VERCEL_URL ? 'https' : 'http'
    const host = process.env.VERCEL_URL ?? 'localhost:3000'
    const r = await fetch(`${proto}://${host}/api/cron/aides-research`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
