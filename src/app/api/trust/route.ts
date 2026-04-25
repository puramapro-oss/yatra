import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trustLevel } from '@/lib/trust'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: trust } = await supabase
    .from('trust_scores')
    .select('score, proofs_ok, proofs_failed, audits_passed, audits_failed, reports_credible, reports_invalid, last_event_at')
    .eq('user_id', user.id)
    .maybeSingle()

  // Si pas encore de ligne, retourne 50 par défaut (sans créer la ligne ici, c'est fait par les RPC qui en ont besoin)
  const score = trust?.score ?? 50
  const level = trustLevel(score)

  // 10 derniers événements
  const { data: events } = await supabase
    .from('trust_events')
    .select('id, event_type, delta, reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    state: {
      score,
      proofs_ok: trust?.proofs_ok ?? 0,
      proofs_failed: trust?.proofs_failed ?? 0,
      audits_passed: trust?.audits_passed ?? 0,
      audits_failed: trust?.audits_failed ?? 0,
      reports_credible: trust?.reports_credible ?? 0,
      reports_invalid: trust?.reports_invalid ?? 0,
      last_event_at: trust?.last_event_at ?? null,
      level: level.level,
      level_label: level.label,
    },
    events: events ?? [],
  })
}
