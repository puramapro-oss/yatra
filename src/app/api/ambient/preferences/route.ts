import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PrefsSchema = z.object({
  last_mode_slug: z.string().min(1).max(40).nullable().optional(),
  default_volume: z.number().min(0).max(1).optional(),
  binaural_enabled: z.boolean().optional(),
  haptics_enabled: z.boolean().optional(),
  auto_during_trip: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = PrefsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_ambient_preferences')
      .upsert(
        { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
