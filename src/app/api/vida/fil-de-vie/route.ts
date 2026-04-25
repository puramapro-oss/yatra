import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_EVENTS = [
  'signup',
  'onboarding_started',
  'onboarding_completed',
  'first_clean_trip',
  'first_credit',
  'first_referral',
  'first_aide_activated',
  'rang_changed',
  'mission_completed',
  'voyage_humanitaire',
  'first_withdrawal',
  'streak_milestone',
  'concours_top10',
  'tirage_winner',
] as const

const postSchema = z.object({
  event_type: z.enum(ALLOWED_EVENTS),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('fil_de_vie')
    .select('id, app_slug, event_type, payload, irreversible, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ events: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = postSchema.parse(body)

    const { error } = await supabase.from('fil_de_vie').insert({
      user_id: user.id,
      app_slug: 'yatra',
      event_type: data.event_type,
      payload: data.payload,
      irreversible: true,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
