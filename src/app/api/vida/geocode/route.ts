import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchPlace } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').trim()
    if (q.length < 2) return NextResponse.json({ results: [] })

    const results = await searchPlace(q, 5)
    return NextResponse.json({ results })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
