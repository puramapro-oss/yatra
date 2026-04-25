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

    const { data, error } = await supabase.rpc('complete_challenge_v1' as never, {
      p_user_id: user.id,
      p_challenge_id: id,
    } as never)

    if (error) {
      const msg = error.message
      if (msg.includes('challenge_not_found')) {
        return NextResponse.json({ error: 'Challenge introuvable' }, { status: 404 })
      }
      if (msg.includes('challenge_not_active')) {
        return NextResponse.json({ error: 'Challenge déjà clôturé' }, { status: 409 })
      }
      if (msg.includes('too_early')) {
        return NextResponse.json({ error: 'Trop tôt pour clôturer (avant la fin de période)' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
