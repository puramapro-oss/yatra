import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const trackSchema = z.object({
  promo_id: z.string().uuid(),
  type: z.enum(['view', 'click']),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = trackSchema.parse(body)

    // Service-role : bump compteur sans auth (sendBeacon ne porte pas le cookie de manière fiable)
    const supabase = createServiceClient()
    const field = data.type === 'view' ? 'views' : 'clicks'

    // Soft increment (non-atomic mais OK pour metric soft)
    const { data: row } = await supabase
      .from('cross_promos')
      .select(field)
      .eq('id', data.promo_id)
      .maybeSingle()

    const current = row ? (row as Record<string, number>)[field] ?? 0 : 0
    await supabase
      .from('cross_promos')
      .update({ [field]: current + 1 })
      .eq('id', data.promo_id)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
