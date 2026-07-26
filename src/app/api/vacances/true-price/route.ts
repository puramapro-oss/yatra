import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { computeTruePrice, type FeeSchedule, type AirportTransfer } from '@/lib/vacances/true-price'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  prix_affiche_eur: z.number().min(0).max(50000),
  transporteur: z.string().min(1).max(80).nullable(),
  options: z.object({
    bagage_cabine: z.boolean(),
    bagage_soute: z.boolean(),
    siege: z.boolean(),
    frais_dossier: z.boolean(),
  }),
  transfert_aeroport_code: z.string().length(3).nullable().optional(),
  transfert_mode: z.enum(['public', 'taxi']).nullable().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [{ data: fees }, { data: transfers }] = await Promise.all([
    supabase.from('vacances_fee_schedules').select('*').eq('active', true).order('transporteur'),
    supabase.from('vacances_airport_transfers').select('*').order('ville'),
  ])

  return NextResponse.json({ transporteurs: fees ?? [], aeroports: transfers ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())

    let fee: FeeSchedule | null = null
    if (body.transporteur) {
      const { data } = await supabase
        .from('vacances_fee_schedules')
        .select('*')
        .eq('transporteur', body.transporteur)
        .eq('active', true)
        .maybeSingle()
      fee = data
    }

    let transfer: AirportTransfer | null = null
    if (body.transfert_aeroport_code) {
      const { data } = await supabase
        .from('vacances_airport_transfers')
        .select('*')
        .eq('code_aeroport', body.transfert_aeroport_code.toUpperCase())
        .maybeSingle()
      transfer = data
    }

    const result = computeTruePrice({
      prixAffiche: body.prix_affiche_eur,
      fee,
      options: {
        bagageCabine: body.options.bagage_cabine,
        bagageSoute: body.options.bagage_soute,
        siege: body.options.siege,
        fraisDossier: body.options.frais_dossier,
      },
      transfer,
      transferMode: body.transfert_mode ?? null,
    })

    const { error: insertError } = await supabase.from('vacances_true_price_calculations').insert({
      user_id: user.id,
      transporteur: body.transporteur,
      prix_affiche_eur: body.prix_affiche_eur,
      options: body.options,
      transfert_aeroport_code: body.transfert_aeroport_code ?? null,
      breakdown: result.breakdown,
      total_min_eur: result.totalMin,
      total_max_eur: result.totalMax,
      badge_prix_verifie: result.badgePrixVerifie,
    })
    if (insertError) throw new Error(insertError.message)

    return NextResponse.json(result)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
