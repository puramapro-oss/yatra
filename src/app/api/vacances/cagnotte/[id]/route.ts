import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const patchSchema = z.object({ statut: z.enum(['active', 'cloturee']) })

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: cagnotte } = await supabase.from('vacances_cagnottes').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!cagnotte) return NextResponse.json({ error: 'Cagnotte introuvable' }, { status: 404 })

  const { data: contributions } = await supabase
    .from('vacances_cagnotte_contributions')
    .select('*')
    .eq('cagnotte_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ cagnotte, contributions: contributions ?? [] })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = patchSchema.parse(await request.json())

    const { data, error } = await supabase
      .from('vacances_cagnottes')
      .update({ statut: body.statut })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: 'Cagnotte introuvable' }, { status: 404 })

    return NextResponse.json({ cagnotte: data })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
