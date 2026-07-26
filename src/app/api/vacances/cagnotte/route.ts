import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateCagnotteCode } from '@/lib/vacances/cagnotte'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  titre: z.string().min(2).max(120),
  destination: z.string().max(80).nullable().optional(),
  objectif_eur: z.number().min(1).max(100000),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('vacances_cagnottes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ cagnottes: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())

    let code = generateCagnotteCode()
    let attempts = 0
    let inserted = null
    let lastError: { message: string } | null = null

    while (attempts < 3 && !inserted) {
      const { data, error } = await supabase
        .from('vacances_cagnottes')
        .insert({
          user_id: user.id,
          titre: body.titre,
          destination: body.destination ?? null,
          objectif_eur: body.objectif_eur,
          lien_partage_code: code,
        })
        .select()
        .single()
      if (!error) {
        inserted = data
        break
      }
      lastError = error
      code = generateCagnotteCode()
      attempts++
    }

    if (!inserted) throw new Error(lastError?.message ?? 'Impossible de créer la cagnotte')

    return NextResponse.json({ cagnotte: inserted })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
