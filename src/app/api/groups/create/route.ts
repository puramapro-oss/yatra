import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(['transport', 'activite', 'soins', 'culture', 'autre']),
  city: z.string().max(100).optional().nullable(),
  target_count: z.number().int().min(2).max(1000),
  unit_price_eur: z.number().min(0).max(100000),
  group_price_eur: z.number().min(0).max(100000),
  deadline_days: z.number().int().min(1).max(180).default(14),
  partner_url: z.string().url().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = createSchema.parse(body)

    if (data.group_price_eur >= data.unit_price_eur) {
      return NextResponse.json({ error: 'Le prix groupe doit être < au prix unitaire' }, { status: 400 })
    }

    const deadline = new Date(Date.now() + data.deadline_days * 86400 * 1000).toISOString()

    const { data: group, error } = await supabase
      .from('group_purchases')
      .insert({
        creator_id: user.id,
        title: data.title,
        description: data.description ?? null,
        category: data.category,
        city: data.city ?? null,
        target_count: data.target_count,
        current_count: 1,
        unit_price_eur: data.unit_price_eur,
        group_price_eur: data.group_price_eur,
        deadline,
        partner_url: data.partner_url ?? null,
        status: 'open',
      })
      .select('id, title, status')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-join creator
    await supabase.from('group_purchase_members').insert({
      group_id: group.id,
      user_id: user.id,
    })

    // Fil de Vie
    await supabase.from('fil_de_vie').insert({
      user_id: user.id,
      app_slug: 'yatra',
      event_type: 'group_created',
      payload: { group_id: group.id, title: group.title },
      irreversible: true,
    })

    return NextResponse.json({ group })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
