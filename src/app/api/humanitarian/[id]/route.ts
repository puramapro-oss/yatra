import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const isUuid = UUID_RX.test(id)
    const { data: mission, error } = await supabase
      .from('humanitarian_missions')
      .select('*')
      .eq(isUuid ? 'id' : 'slug', id)
      .eq('active', true)
      .maybeSingle()

    if (error || !mission) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from('humanitarian_applications')
      .select('id, status, applied_at, responded_at')
      .eq('user_id', user.id)
      .eq('mission_id', mission.id)
      .maybeSingle()

    return NextResponse.json({
      mission,
      application: existing ?? null,
      spots_left: mission.spots_total - mission.spots_taken,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
