import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { eu261Distance, eu261CheckEligibility, eu261GenerateLetter } from '@/lib/vacances/eu261'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  nom_complet: z.string().min(2).max(120),
  compagnie: z.string().min(2).max(80),
  numero_vol: z.string().min(3).max(10),
  date_vol: z.string().min(8).max(10),
  aeroport_depart_code: z.string().length(3),
  aeroport_arrivee_code: z.string().length(3),
  type_incident: z.enum(['retard', 'annulation', 'refus_embarquement']),
  retard_heures: z.number().min(0).max(72).nullable().optional(),
  jours_notice_annulation: z.number().int().min(0).max(365).nullable().optional(),
  circonstances_extraordinaires_invoquees: z.boolean().default(false),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [{ data: claims }, { data: airports }] = await Promise.all([
    supabase.from('vacances_eu261_claims').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('vacances_airports_geo').select('*').order('ville'),
  ])

  return NextResponse.json({ reclamations: claims ?? [], aeroports: airports ?? [] })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = bodySchema.parse(await request.json())

    const [{ data: depart }, { data: arrivee }] = await Promise.all([
      supabase.from('vacances_airports_geo').select('*').eq('code_iata', body.aeroport_depart_code.toUpperCase()).maybeSingle(),
      supabase.from('vacances_airports_geo').select('*').eq('code_iata', body.aeroport_arrivee_code.toUpperCase()).maybeSingle(),
    ])
    if (!depart || !arrivee) {
      return NextResponse.json({ error: "Aéroport de départ ou d'arrivée non reconnu. Choisis-en un dans la liste." }, { status: 400 })
    }

    const distanceKm = eu261Distance({ lat: depart.lat, lon: depart.lon }, { lat: arrivee.lat, lon: arrivee.lon })

    const result = eu261CheckEligibility({
      typeIncident: body.type_incident,
      retardHeures: body.retard_heures ?? null,
      joursNoticeAnnulation: body.jours_notice_annulation ?? null,
      circonstancesExtraordinairesInvoquees: body.circonstances_extraordinaires_invoquees,
      departUE: depart.ue,
      arriveeUE: arrivee.ue,
      compagnieUE: true, // simplification V1 : l'utilisateur ne saisit pas la nationalité de la compagnie, cf note UI
      distanceKm,
    })

    const lettre = eu261GenerateLetter({
      nomComplet: body.nom_complet,
      compagnie: body.compagnie,
      numeroVol: body.numero_vol,
      dateVol: body.date_vol,
      aeroportDepart: `${depart.nom} (${depart.code_iata})`,
      aeroportArrivee: `${arrivee.nom} (${arrivee.code_iata})`,
      typeIncident: body.type_incident,
      retardHeures: body.retard_heures ?? null,
      montantEstimeEur: result.montantEstimeEur,
    })

    const { data: inserted, error: insertError } = await supabase
      .from('vacances_eu261_claims')
      .insert({
        user_id: user.id,
        compagnie: body.compagnie,
        numero_vol: body.numero_vol,
        date_vol: body.date_vol,
        aeroport_depart_code: depart.code_iata,
        aeroport_arrivee_code: arrivee.code_iata,
        distance_km: distanceKm,
        type_incident: body.type_incident,
        retard_heures: body.retard_heures ?? null,
        jours_notice_annulation: body.jours_notice_annulation ?? null,
        circonstances_extraordinaires_invoquees: body.circonstances_extraordinaires_invoquees,
        eligibilite: result.eligibilite,
        motif_eligibilite: result.motif,
        montant_estime_eur: result.montantEstimeEur,
        nom_complet: body.nom_complet,
        lettre_texte: lettre,
      })
      .select()
      .single()
    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({ reclamation: inserted })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
