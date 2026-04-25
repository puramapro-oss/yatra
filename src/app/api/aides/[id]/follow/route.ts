import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  status: z.enum(['following', 'dismissed', 'applied', 'received']).default('following'),
  notes: z.string().max(500).optional().nullable(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Resolve id ou slug → aide.id
    const { data: aide } = await supabase
      .from('aides')
      .select('id, nom')
      .or(`id.eq.${id},slug.eq.${id}`)
      .eq('active', true)
      .maybeSingle()

    if (!aide) return NextResponse.json({ error: 'Aide introuvable' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const data = bodySchema.parse(body)

    const { data: sub, error } = await supabase
      .from('aides_subscriptions')
      .upsert(
        {
          user_id: user.id,
          aide_id: aide.id,
          status: data.status,
          notes: data.notes ?? null,
        },
        { onConflict: 'user_id,aide_id' },
      )
      .select('id, status, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fil de Vie événement
    if (data.status === 'following') {
      await supabase.from('fil_de_vie').insert({
        user_id: user.id,
        app_slug: 'yatra',
        event_type: 'aide_followed',
        payload: { aide_id: aide.id, aide_nom: aide.nom },
        irreversible: true,
      })
    } else if (data.status === 'applied') {
      await supabase.from('fil_de_vie').insert({
        user_id: user.id,
        app_slug: 'yatra',
        event_type: 'aide_applied',
        payload: { aide_id: aide.id, aide_nom: aide.nom },
        irreversible: true,
      })
    }

    return NextResponse.json({ subscription: sub })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: aide } = await supabase
      .from('aides')
      .select('id')
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle()

    if (!aide) return NextResponse.json({ error: 'Aide introuvable' }, { status: 404 })

    await supabase
      .from('aides_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('aide_id', aide.id)

    return NextResponse.json({ unfollowed: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
