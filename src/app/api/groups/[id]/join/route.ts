import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase.rpc('group_join_v1' as never, {
      p_user_id: user.id,
      p_group_id: id,
    } as never)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return NextResponse.json({ error: 'Pool introuvable' }, { status: 404 })

    if (row.joined && row.status === 'reached') {
      // Notifier creator + members ? P11. Pour P6 on retourne juste l'unlock_code.
      await supabase.from('fil_de_vie').insert({
        user_id: user.id,
        app_slug: 'yatra',
        event_type: 'group_unlocked',
        payload: { group_id: id, unlock_code: row.unlock_code },
        irreversible: true,
      })
    } else if (row.joined) {
      await supabase.from('fil_de_vie').insert({
        user_id: user.id,
        app_slug: 'yatra',
        event_type: 'group_joined',
        payload: { group_id: id },
        irreversible: true,
      })
    }

    return NextResponse.json({
      joined: !!row.joined,
      new_count: row.new_count,
      status: row.status,
      unlock_code: row.unlock_code,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
