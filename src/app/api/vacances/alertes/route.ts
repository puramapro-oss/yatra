import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  aeroport_depart: z.string().min(2).max(80),
  destination_souhaitee: z.string().min(2).max(80),
  budget_max_eur: z.number().min(0).max(20000).nullable().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [{ data: configs }, { data: notifications }] = await Promise.all([
    supabase.from('vacances_alert_configs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase
      .from('vacances_alert_notifications')
      .select('*, deal:vacances_deals_found(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return NextResponse.json({ configs: configs ?? [], notifications: notifications ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())

    const { data, error } = await supabase
      .from('vacances_alert_configs')
      .insert({
        user_id: user.id,
        aeroport_depart: body.aeroport_depart,
        destination_souhaitee: body.destination_souhaitee,
        budget_max_eur: body.budget_max_eur ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ config: data })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
