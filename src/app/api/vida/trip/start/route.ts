import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const startSchema = z.object({
  declared_mode: z.enum([
    'marche', 'velo', 'trottinette', 'transport_public', 'covoiturage',
    'voiture_perso', 'avion', 'train',
  ]),
  from_label: z.string().nullable().optional(),
  to_label: z.string().nullable().optional(),
  from_lat: z.number().nullable().optional(),
  from_lon: z.number().nullable().optional(),
  to_lat: z.number().nullable().optional(),
  to_lon: z.number().nullable().optional(),
  partner_slug: z.string().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = startSchema.parse(body)

    // Discard les trips actifs précédents (max 1 actif par user)
    await supabase
      .from('trips')
      .update({ status: 'discarded' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        status: 'active',
        declared_mode: data.declared_mode,
        from_label: data.from_label ?? null,
        to_label: data.to_label ?? null,
        from_lat: data.from_lat ?? null,
        from_lon: data.from_lon ?? null,
        to_lat: data.to_lat ?? null,
        to_lon: data.to_lon ?? null,
        partner_slug: data.partner_slug ?? null,
      })
      .select('id, started_at')
      .single()

    if (error || !trip) {
      return NextResponse.json({ error: 'Impossible de créer le trajet', details: error?.message }, { status: 500 })
    }

    return NextResponse.json({ trip_id: trip.id, started_at: trip.started_at })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
