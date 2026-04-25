import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const StartSchema = z.object({
  mode_slug: z.string().min(1).max(40),
  trip_id: z.string().uuid().optional().nullable(),
})

const EndSchema = z.object({
  session_id: z.string().uuid(),
  duration_seconds: z.number().int().min(0).max(86400),
  binaural_played: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsedStart = StartSchema.safeParse(body)
    if (!parsedStart.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('ambient_sessions')
      .insert({
        user_id: user.id,
        mode_slug: parsedStart.data.mode_slug,
        trip_id: parsedStart.data.trip_id ?? null,
      })
      .select('id, started_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = EndSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const { error: updErr } = await supabase
      .from('ambient_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: parsed.data.duration_seconds,
        binaural_played: parsed.data.binaural_played ?? false,
      })
      .eq('id', parsed.data.session_id)
      .eq('user_id', user.id)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // Mise à jour cumul minutes
    const minutes = Math.floor(parsed.data.duration_seconds / 60)
    if (minutes > 0) {
      const { data: existing } = await supabase
        .from('user_ambient_preferences')
        .select('total_minutes_listened')
        .eq('user_id', user.id)
        .maybeSingle()

      await supabase
        .from('user_ambient_preferences')
        .upsert(
          {
            user_id: user.id,
            total_minutes_listened: (existing?.total_minutes_listened ?? 0) + minutes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
