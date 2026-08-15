import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params

    const { data: soin, error } = await supabase
      .from('soins_naturels')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!soin) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

    return NextResponse.json({ soin })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
