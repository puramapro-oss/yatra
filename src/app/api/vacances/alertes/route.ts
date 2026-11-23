import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { readAlerts } from '@/lib/vacances/alertes-data'
import { alertConfigSchema } from '@/lib/vacances/alertes-input'
import { alertConfigId, alertConfigKey } from '@/lib/vacances/alertes-identity'
import type { AlertConfig } from '@/lib/vacances/alertes-types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const unavailable = () => NextResponse.json({
  error: 'Les alertes sont momentanément indisponibles. Réessaie dans quelques instants.',
}, { status: 503 })

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error && (!error.status || error.status >= 500)) return unavailable()
    if (!user) return NextResponse.json({ error: 'Connecte-toi pour consulter tes alertes.' }, { status: 401 })
    return NextResponse.json(await readAlerts(supabase, user.id))
  } catch {
    return unavailable()
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError && (!authError.status || authError.status >= 500)) return unavailable()
    if (!user) return NextResponse.json({ error: 'Connecte-toi pour créer une alerte.' }, { status: 401 })
    const body = alertConfigSchema.parse(await request.json())
    const signal = AbortSignal.timeout(10000)
    const configs = await supabase.from('vacances_alert_configs').select('*').eq('user_id', user.id).abortSignal(signal)
    if (configs.error) return unavailable()
    const matches = (configs.data as AlertConfig[] | null)?.filter((config) => alertConfigKey(config) === alertConfigKey(body)) ?? []
    const matching = matches.find((config) => config.actif) ?? matches[0]
    if (matching?.actif) return NextResponse.json({ config: matching, existing: true })
    if (matching) {
      const reactivated = await supabase.from('vacances_alert_configs').update({ actif: true })
        .eq('id', matching.id).eq('user_id', user.id).select().abortSignal(signal).single()
      if (reactivated.error) return unavailable()
      return NextResponse.json({ config: reactivated.data, existing: true })
    }
    const id = alertConfigId(user.id, body)
    const { data, error } = await supabase.from('vacances_alert_configs').insert({
      id, user_id: user.id, ...body, budget_max_eur: body.budget_max_eur ?? null,
    }).select().abortSignal(signal).single()
    if (error?.code === '23505') {
      const concurrent = await supabase.from('vacances_alert_configs').select('*')
        .eq('id', id).eq('user_id', user.id).abortSignal(signal).single()
      if (!concurrent.error && concurrent.data) return NextResponse.json({ config: concurrent.data, existing: true })
    }
    if (error || !data) return unavailable()
    return NextResponse.json({ config: data, existing: false }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Vérifie le départ, la destination et le budget (0,01 à 20 000 €).' }, { status: 400 })
    }
    return unavailable()
  }
}
