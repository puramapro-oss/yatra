import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isValidInviteCode } from '@/lib/family'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const JoinSchema = z.object({
  invite_code: z.string().min(6).max(6),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = JoinSchema.safeParse(body)
    if (!parsed.success || !isValidInviteCode(parsed.data.invite_code)) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('join_family_v1' as never, {
      p_user_id: user.id,
      p_invite_code: parsed.data.invite_code.toUpperCase(),
    } as never)

    if (error) {
      const msg = error.message
      if (msg.includes('family_not_found')) {
        return NextResponse.json({ error: 'Aucune famille trouvée pour ce code' }, { status: 404 })
      }
      if (msg.includes('invite_expired')) {
        return NextResponse.json({ error: 'Ce code d\'invitation a expiré' }, { status: 410 })
      }
      if (msg.includes('already_in_family')) {
        return NextResponse.json({ error: 'Tu es déjà dans une famille' }, { status: 409 })
      }
      if (msg.includes('family_full')) {
        return NextResponse.json({ error: 'Cette famille est complète' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ ok: true, result: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
