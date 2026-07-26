import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateBudgetPropositions, type Destination } from '@/lib/vacances/budget-inverse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  budget_eur: z.number().min(50).max(50000),
  jours: z.number().int().min(1).max(90),
  depart: z.string().min(2).max(80).default('Paris'),
  avec_qui: z.string().max(80).nullable().optional(),
  envies: z.array(z.string().max(30)).max(10).default([]),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())

    const { data: destinations, error: destError } = await supabase
      .from('vacances_destinations')
      .select('*')
      .eq('active', true)
    if (destError) throw new Error(destError.message)
    if (!destinations || destinations.length === 0) {
      return NextResponse.json({ error: 'Catalogue de destinations indisponible pour le moment.' }, { status: 503 })
    }

    const results = generateBudgetPropositions(
      { budgetEur: body.budget_eur, jours: body.jours, envies: body.envies, depart: body.depart },
      destinations as Destination[],
    )

    const { error: insertError } = await supabase.from('vacances_budget_searches').insert({
      user_id: user.id,
      budget_eur: body.budget_eur,
      jours: body.jours,
      depart: body.depart,
      avec_qui: body.avec_qui ?? null,
      envies: body.envies,
      results,
    })
    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({ propositions: results })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
