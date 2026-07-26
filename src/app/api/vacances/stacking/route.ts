import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { buildStackingChecklist } from '@/lib/vacances/stacking'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const checklistSchema = z.object({
  merchant: z.string().min(1).max(80),
  type_reservation: z.enum(['vol', 'hotel', 'activite', 'location_voiture']),
})

const usageSchema = checklistSchema.extend({
  montant_reservation_eur: z.number().min(0).max(50000),
  cashback_recupere_eur: z.number().min(0).max(5000).default(0),
  code_promo_recupere_eur: z.number().min(0).max(5000).default(0),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const merchant = searchParams.get('merchant')
  const typeReservation = searchParams.get('type_reservation')

  if (merchant && typeReservation) {
    const parsed = checklistSchema.safeParse({ merchant, type_reservation: typeReservation })
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    return NextResponse.json({ checklist: buildStackingChecklist({ merchant: parsed.data.merchant, typeReservation: parsed.data.type_reservation }) })
  }

  const { data, error } = await supabase
    .from('vacances_stacking_usage')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ usages: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = usageSchema.parse(await request.json())

    const { data, error } = await supabase
      .from('vacances_stacking_usage')
      .insert({
        user_id: user.id,
        merchant: body.merchant,
        type_reservation: body.type_reservation,
        montant_reservation_eur: body.montant_reservation_eur,
        cashback_recupere_eur: body.cashback_recupere_eur,
        code_promo_recupere_eur: body.code_promo_recupere_eur,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ usage: data })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
