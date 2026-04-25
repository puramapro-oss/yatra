import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ApplySchema = z.object({
  motivation: z.string().min(50, 'La motivation doit faire au moins 50 caractères').max(2000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = ApplySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Payload invalide' }, { status: 400 })
    }

    const isUuid = UUID_RX.test(id)
    const { data: mission, error: me } = await supabase
      .from('humanitarian_missions')
      .select('id, slug, title, spots_total, spots_taken, active, required_age_min')
      .eq(isUuid ? 'id' : 'slug', id)
      .maybeSingle()

    if (me || !mission || !mission.active) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })
    }
    if (mission.spots_taken >= mission.spots_total) {
      return NextResponse.json({ error: 'Mission complète' }, { status: 409 })
    }

    const { data: existing } = await supabase
      .from('humanitarian_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('mission_id', mission.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: `Tu as déjà candidaté (${existing.status})`,
        application: existing,
      }, { status: 409 })
    }

    const { data: app, error: ae } = await supabase
      .from('humanitarian_applications')
      .insert({
        user_id: user.id,
        mission_id: mission.id,
        motivation: parsed.data.motivation.trim(),
      })
      .select('id, status, applied_at')
      .single()

    if (ae || !app) {
      return NextResponse.json({ error: ae?.message ?? 'Erreur' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      application: app,
      mission: { id: mission.id, slug: mission.slug, title: mission.title },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const isUuid = UUID_RX.test(id)
    const { data: mission } = await supabase
      .from('humanitarian_missions')
      .select('id')
      .eq(isUuid ? 'id' : 'slug', id)
      .maybeSingle()

    if (!mission) return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })

    const { error } = await supabase
      .from('humanitarian_applications')
      .update({ status: 'withdrawn', responded_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('mission_id', mission.id)
      .eq('status', 'pending')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
