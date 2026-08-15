import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const categorie = url.searchParams.get('categorie')
    const ville = url.searchParams.get('ville')
    const region = url.searchParams.get('region')
    const tarifSolidaire = url.searchParams.get('tarif_solidaire') === 'true'
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100)

    // Fetch soins naturels actifs
    let query = supabase
      .from('soins_naturels')
      .select('id, nom, categorie, description, ville, region, tarif_indicatif_min, tarif_indicatif_max, tarif_solidaire, description_tarif_solidaire, lien_officiel, created_at')
      .eq('active', true)

    if (categorie) query = query.eq('categorie', categorie)
    if (ville) query = query.ilike('ville', `%${ville}%`)
    if (region) query = query.ilike('region', `%${region}%`)
    if (tarifSolidaire) query = query.eq('tarif_solidaire', true)

    query = query.order('created_at', { ascending: false }).limit(limit)

    const { data: soins, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      soins: soins ?? [],
      total: (soins ?? []).length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
