import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const [{ data: modes, error: me }, { data: prefs }] = await Promise.all([
      supabase
        .from('ambient_modes')
        .select('id, slug, name, tagline, description, carrier_hz, beat_hz, beat_band, primary_color, secondary_color, ideal_time_of_day, ideal_trip_mode, emoji, display_order')
        .eq('active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('user_ambient_preferences')
        .select('last_mode_slug, default_volume, binaural_enabled, haptics_enabled, auto_during_trip, total_minutes_listened')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (me) return NextResponse.json({ error: me.message }, { status: 500 })

    return NextResponse.json({
      modes: modes ?? [],
      preferences: prefs ?? null,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
