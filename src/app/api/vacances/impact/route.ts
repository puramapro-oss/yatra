import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Compteur permanent §10 — "YATRA t'a fait économiser/récupérer : XXX€".
 * Chaque montant est déjà calculé (jamais estimé côté serveur) au moment où l'utilisateur
 * a confirmé l'usage réel dans un des modules VACANCES — on se contente de sommer ce qui
 * a réellement été enregistré, table par table (RLS scope chaque requête à l'utilisateur).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [eu261, rebooking, logement, stacking, passCalc, cagnotte, repositionnement] = await Promise.all([
    supabase.from('vacances_eu261_claims').select('montant_obtenu_eur').eq('user_id', user.id).eq('statut', 'obtenue'),
    supabase.from('vacances_tracked_bookings').select('economie_potentielle_eur').eq('user_id', user.id).eq('statut', 'rebooke'),
    supabase.from('vacances_logement_usage').select('cout_evite_min_eur, cout_evite_max_eur').eq('user_id', user.id),
    supabase.from('vacances_stacking_usage').select('cashback_recupere_eur, code_promo_recupere_eur').eq('user_id', user.id),
    supabase.from('vacances_pass_calculations').select('economie_eur').eq('user_id', user.id).eq('rentable', true),
    supabase.from('vacances_cagnotte_contributions').select('montant_eur'),
    supabase.from('vacances_repositionnement_usage').select('economie_eur').eq('user_id', user.id),
  ])

  const sum = (rows: Record<string, number | null>[] | null, ...keys: string[]) =>
    (rows ?? []).reduce((total, row) => total + keys.reduce((s, k) => s + Number(row[k] ?? 0), 0), 0)

  const breakdown = {
    eu261_eur: Math.round(sum(eu261.data, 'montant_obtenu_eur') * 100) / 100,
    rebooking_eur: Math.round(sum(rebooking.data, 'economie_potentielle_eur') * 100) / 100,
    logement_eur: Math.round((sum(logement.data, 'cout_evite_min_eur') + sum(logement.data, 'cout_evite_max_eur')) / 2 * 100) / 100,
    stacking_eur: Math.round(sum(stacking.data, 'cashback_recupere_eur', 'code_promo_recupere_eur') * 100) / 100,
    sur_place_eur: Math.round(sum(passCalc.data, 'economie_eur') * 100) / 100,
    cagnotte_eur: Math.round(sum(cagnotte.data, 'montant_eur') * 100) / 100,
    repositionnement_eur: Math.round(sum(repositionnement.data, 'economie_eur') * 100) / 100,
  }

  const total_eur = Math.round(Object.values(breakdown).reduce((s, v) => s + v, 0) * 100) / 100

  return NextResponse.json({ total_eur, breakdown })
}
