import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  label: z.string().min(2).max(120),
  prix_paye_eur: z.number().min(0).max(50000),
  lien_reservation: z.string().url().max(500).nullable().optional(),
  annulable: z.boolean().default(true),
  date_limite_annulation: z.string().nullable().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('vacances_tracked_bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ reservations: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())

    const { data, error } = await supabase
      .from('vacances_tracked_bookings')
      .insert({
        user_id: user.id,
        label: body.label,
        prix_paye_eur: body.prix_paye_eur,
        lien_reservation: body.lien_reservation ?? null,
        annulable: body.annulable,
        date_limite_annulation: body.date_limite_annulation ?? null,
      })
      .select()
      .single()
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
