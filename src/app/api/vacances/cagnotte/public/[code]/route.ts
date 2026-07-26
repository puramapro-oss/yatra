import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isValidCagnotteCode } from '@/lib/vacances/cagnotte'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Page publique de contribution — pas d'auth (les proches n'ont pas forcément de compte YATRA). */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!isValidCagnotteCode(code)) return NextResponse.json({ error: 'Lien invalide' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: cagnotte } = await supabase
    .from('vacances_cagnottes')
    .select('id, titre, destination, objectif_eur, montant_actuel_eur, statut')
    .eq('lien_partage_code', code.toUpperCase())
    .maybeSingle()

  if (!cagnotte) return NextResponse.json({ error: 'Cagnotte introuvable' }, { status: 404 })

  return NextResponse.json({ cagnotte })
}
