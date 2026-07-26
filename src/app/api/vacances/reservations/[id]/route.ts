import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const patchSchema = z.object({
  prix_constate_eur: z.number().min(0).max(50000).nullable().optional(),
  statut: z.enum(['suivi', 'rebooke', 'abandonne', 'expire']).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = patchSchema.parse(await request.json())

    const { data: existing } = await supabase
      .from('vacances_tracked_bookings')
      .select('prix_paye_eur')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })

    const update: Record<string, unknown> = { updated_at: new Date().toISOString(), derniere_verification_at: new Date().toISOString() }
    if (body.prix_constate_eur !== undefined) {
      update.prix_constate_eur = body.prix_constate_eur
      update.economie_potentielle_eur = body.prix_constate_eur !== null
        ? Math.max(0, Number(existing.prix_paye_eur) - Number(body.prix_constate_eur))
        : null
    }
    if (body.statut) update.statut = body.statut

    const { data, error } = await supabase
      .from('vacances_tracked_bookings')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)

    return NextResponse.json({ reservation: data })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
