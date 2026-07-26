import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const patchSchema = z.object({
  statut: z.enum(['envoyee', 'obtenue', 'refusee']),
  montant_obtenu_eur: z.number().min(0).max(2000).nullable().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = patchSchema.parse(await request.json())

    const update: Record<string, unknown> = { statut: body.statut, updated_at: new Date().toISOString() }
    if (body.statut === 'obtenue') {
      update.montant_obtenu_eur = body.montant_obtenu_eur ?? null
    }

    const { data, error } = await supabase
      .from('vacances_eu261_claims')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: 'Réclamation introuvable' }, { status: 404 })

    return NextResponse.json({ reclamation: data })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
