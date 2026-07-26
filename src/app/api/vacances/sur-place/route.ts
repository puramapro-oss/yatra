import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculerRentabilitePass, VILLES_TRANSPORT_GRATUIT, REPAS_ANTI_GASPI } from '@/lib/vacances/sur-place'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  ville: z.string().max(80).nullable().optional(),
  prix_pass_eur: z.number().min(0).max(5000),
  activites: z.array(z.object({ nom: z.string().min(1).max(80), prix_eur: z.number().min(0).max(2000) })).min(1).max(20),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  return NextResponse.json({ villes_transport_gratuit: VILLES_TRANSPORT_GRATUIT, repas_anti_gaspi: REPAS_ANTI_GASPI })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())
    const result = calculerRentabilitePass(
      body.prix_pass_eur,
      body.activites.map((a) => ({ nom: a.nom, prixEur: a.prix_eur })),
    )

    const { error } = await supabase.from('vacances_pass_calculations').insert({
      user_id: user.id,
      ville: body.ville ?? null,
      prix_pass_eur: body.prix_pass_eur,
      total_individuel_eur: result.totalIndividuelEur,
      economie_eur: result.economieEur,
      rentable: result.rentable,
    })
    if (error) throw new Error(error.message)

    return NextResponse.json(result)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
