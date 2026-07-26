import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  calculerEconomieRepositionnement,
  CANAUX_REPOSITIONNEMENT,
  CROISIERES_DERNIERE_MINUTE,
  VOLS_REPOSITIONNEMENT,
} from '@/lib/vacances/repositionnement'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  canal: z.enum(['convoyage_vehicule', 'location_aller_simple', 'vol_repositionnement', 'croisiere_derniere_minute']),
  description: z.string().max(200).nullable().optional(),
  prix_normal_estime_eur: z.number().min(0).max(50000),
  prix_paye_eur: z.number().min(0).max(50000),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('vacances_repositionnement_usage')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    usages: data ?? [],
    canaux: CANAUX_REPOSITIONNEMENT,
    croisieres: CROISIERES_DERNIERE_MINUTE,
    vols_repositionnement: VOLS_REPOSITIONNEMENT,
  })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())
    const { economieEur } = calculerEconomieRepositionnement(body.prix_normal_estime_eur, body.prix_paye_eur)

    const { data, error } = await supabase
      .from('vacances_repositionnement_usage')
      .insert({
        user_id: user.id,
        canal: body.canal,
        description: body.description ?? null,
        prix_normal_estime_eur: body.prix_normal_estime_eur,
        prix_paye_eur: body.prix_paye_eur,
        economie_eur: economieEur,
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
