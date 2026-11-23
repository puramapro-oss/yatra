import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError && (!authError.status || authError.status >= 500)) throw new Error('Authentification indisponible')
    if (!user) return NextResponse.json({ error: 'Connecte-toi pour modifier tes alertes.' }, { status: 401 })
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Identifiant d’alerte invalide.' }, { status: 400 })
    const { error } = await supabase.from('vacances_alert_configs').delete()
      .eq('id', id).eq('user_id', user.id).abortSignal(AbortSignal.timeout(10000))
    if (error) throw new Error('Suppression indisponible')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Suppression impossible pour le moment. Réessaie dans quelques instants.' }, { status: 503 })
  }
}
