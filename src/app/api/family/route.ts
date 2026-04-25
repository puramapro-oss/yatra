import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateInviteCode, formatFamilyName } from '@/lib/family'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CreateSchema = z.object({
  name: z.string().min(2).max(80),
  max_members: z.number().int().min(2).max(20).optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id, role, joined_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ family: null, members: [], cumul: null })
    }

    const [{ data: family }, { data: members }] = await Promise.all([
      supabase
        .from('families')
        .select('id, owner_id, name, invite_code, max_members, created_at')
        .eq('id', membership.family_id)
        .maybeSingle(),
      supabase
        .from('family_members')
        .select('user_id, role, joined_at, profiles!inner(full_name, score_humanite)')
        .eq('family_id', membership.family_id)
        .order('joined_at', { ascending: true }),
    ])

    if (!family) return NextResponse.json({ family: null, members: [], cumul: null })

    // Cumul km vélo + score humanité famille (lecture trips et profiles côté serveur)
    const memberIds = (members ?? []).map((m) => m.user_id)
    let totalKm = 0
    let scoreSum = 0
    if (memberIds.length > 0) {
      const { data: trips } = await supabase
        .from('trips')
        .select('user_id, distance_km, mode_dominant')
        .in('user_id', memberIds)
        .eq('flagged_fraud', false)
      for (const t of trips ?? []) {
        if (t.mode_dominant === 'velo' || t.mode_dominant === 'marche') {
          totalKm += Number(t.distance_km ?? 0)
        }
      }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, score_humanite')
        .in('id', memberIds)
      for (const p of profiles ?? []) scoreSum += Number(p.score_humanite ?? 0)
    }

    return NextResponse.json({
      family,
      members: members ?? [],
      cumul: {
        km_clean: Number(totalKm.toFixed(2)),
        score_humanite_avg: members && members.length > 0 ? Number((scoreSum / members.length).toFixed(2)) : 0,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Payload invalide' }, { status: 400 })
    }

    // Refuse si user déjà dans une famille (RPC join_family_v1 fait le même check, mais on précoupe ici)
    const { data: existing } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Tu es déjà dans une famille. Quitte-la avant d\'en créer une autre.' }, { status: 409 })
    }

    // Retry sur collision invite_code (improbable mais défensif)
    let attempt = 0
    let inserted = null
    let lastError: string | null = null
    while (attempt < 3 && !inserted) {
      const code = generateInviteCode()
      const { data, error } = await supabase
        .from('families')
        .insert({
          owner_id: user.id,
          name: formatFamilyName(parsed.data.name),
          invite_code: code,
          max_members: parsed.data.max_members ?? 6,
        })
        .select('id, name, invite_code, max_members, created_at')
        .single()
      if (data) {
        inserted = data
        break
      }
      lastError = error?.message ?? null
      if (error?.code === '23505') {
        // unique violation, retry avec nouveau code
        attempt++
        continue
      }
      return NextResponse.json({ error: error?.message ?? 'Erreur création famille' }, { status: 500 })
    }

    if (!inserted) {
      return NextResponse.json({ error: lastError ?? 'Création famille échouée' }, { status: 500 })
    }

    return NextResponse.json({ family: inserted })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
