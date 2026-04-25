import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: membership } = await supabase
      .from('family_members')
      .select('family_id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Tu n\'es dans aucune famille' }, { status: 404 })
    }

    // Si owner unique → on supprime la famille (cascade via FK)
    if (membership.role === 'owner') {
      const { count } = await supabase
        .from('family_members')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', membership.family_id)

      if ((count ?? 0) <= 1) {
        const { error: delErr } = await supabase
          .from('families')
          .delete()
          .eq('id', membership.family_id)
          .eq('owner_id', user.id)
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
        return NextResponse.json({ ok: true, family_dissolved: true })
      }
      return NextResponse.json(
        { error: 'Tu es propriétaire d\'une famille avec d\'autres membres. Transfère la propriété ou exclus les membres avant de partir.' },
        { status: 409 },
      )
    }

    // Sinon : leave normal
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('user_id', user.id)
      .eq('family_id', membership.family_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
