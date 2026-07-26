import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculerEconomieLogement } from '@/lib/vacances/logement-zero'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  canal: z.enum(['house_sitting', 'echange_maison', 'volontariat']),
  destination: z.string().max(80).nullable().optional(),
  nuits: z.number().int().min(1).max(365),
  cout_nuit_min_eur: z.number().min(0).max(2000),
  cout_nuit_max_eur: z.number().min(0).max(2000),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('vacances_logement_usage')
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

    const body = bodySchema.parse(await request.json())
    const { economieMinEur, economieMaxEur } = calculerEconomieLogement(body.nuits, body.cout_nuit_min_eur, body.cout_nuit_max_eur)

    const { data, error } = await supabase
      .from('vacances_logement_usage')
      .insert({
        user_id: user.id,
        canal: body.canal,
        destination: body.destination ?? null,
        nuits: body.nuits,
        cout_evite_min_eur: economieMinEur,
        cout_evite_max_eur: economieMaxEur,
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
