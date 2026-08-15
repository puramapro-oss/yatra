import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rankGratuit, type GratuitEvent } from '@/lib/gratuit-matcher'
import { computeCombinations } from '@/lib/zero-cost'
import { pickMicroDefi } from '@/lib/micro-defis'
import { getMobilityRates } from '@/lib/mobility-rates'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SurpriseSchema = z.object({
  rayon_km: z.number().min(1).max(200),
  budget_eur: z.enum(['0', '5', '10']).transform(Number),
  duree: z.enum(['2h', 'demi_journee', 'weekend']),
  user_lat: z.number().min(-90).max(90),
  user_lon: z.number().min(-180).max(180),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = SurpriseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Paramètres invalides' },
        { status: 400 },
      )
    }

    const { rayon_km, budget_eur, duree, user_lat, user_lon } = parsed.data

    // Récupérer profil utilisateur pour le matcher gratuit
    const { data: profile } = await supabase
      .from('profiles')
      .select('ville_principale, region')
      .eq('id', user.id)
      .maybeSingle()

    const userCity = profile?.ville_principale ?? 'Paris'
    const userRegion = profile?.region ?? 'Île-de-France'

    // 1. Récupérer événements/lieux dans le budget
    const { data: eventsRaw } = await supabase
      .from('gratuit_events')
      .select('*')
      .lte('prix', budget_eur)
      .limit(50)

    const events = (eventsRaw ?? []) as GratuitEvent[]

    if (events.length === 0) {
      return NextResponse.json(
        {
          error: `Aucun lieu trouvé pour un budget ≤${budget_eur}€. Élargis ton rayon ou ton budget.`,
        },
        { status: 404 },
      )
    }

    // 2. Filtrer par rayon (Haversine)
    const eventsInRadius = events.filter((e) => {
      if (!e.lat || !e.lon) return true // national → toujours inclus
      const haversine = Math.sqrt(
        Math.pow(e.lat - user_lat, 2) + Math.pow(e.lon - user_lon, 2),
      ) * 111 // approximation km (1° ≈ 111km)
      return haversine <= rayon_km
    })

    if (eventsInRadius.length === 0) {
      return NextResponse.json(
        {
          error: `Aucun lieu dans un rayon de ${rayon_km} km. Élargis ton rayon.`,
        },
        { status: 404 },
      )
    }

    // 3. Adapter selon durée (2h = très proche, weekend = peut être plus loin)
    const maxDistanceForDuree = duree === '2h' ? rayon_km * 0.3 : duree === 'demi_journee' ? rayon_km * 0.6 : rayon_km
    const eventsAdapted = eventsInRadius.filter((e) => {
      if (!e.lat || !e.lon) return true
      const haversine = Math.sqrt(
        Math.pow(e.lat - user_lat, 2) + Math.pow(e.lon - user_lon, 2),
      ) * 111
      return haversine <= maxDistanceForDuree
    })

    const finalEvents = eventsAdapted.length > 0 ? eventsAdapted : eventsInRadius

    // 4. Trier par score (ville exact > région > distance)
    const ranked = rankGratuit(finalEvents, {
      userCity,
      userRegion,
      userLat: user_lat,
      userLon: user_lon,
    })

    if (ranked.length === 0) {
      return NextResponse.json(
        { error: 'Aucun lieu trouvé. Élargis ton rayon ou ton budget.' },
        { status: 404 },
      )
    }

    // 5. Piocher le top 1 (ou aléatoire parmi top 5 pour surprise)
    const top = ranked.slice(0, 5)
    const chosen = top[Math.floor(Math.random() * top.length)]!

    // 6. Calculer trajet minimal vers ce lieu
    let trajet = null
    if (chosen.lat && chosen.lon) {
      // Récupérer barème mobilité DB (P15)
      const rates = await getMobilityRates().catch(() => null)

      const combos = await computeCombinations(
        { lat: user_lat, lon: user_lon },
        { lat: chosen.lat, lon: chosen.lon },
        rates ?? undefined,
      )

      // Trier par prix (cheapest) puis par CO₂ (cleanest) puis par points
      const sorted = combos.sort((a, b) => {
        if (a.cost_eur !== b.cost_eur) return a.cost_eur - b.cost_eur
        if (a.co2_avoided_kg !== b.co2_avoided_kg) return b.co2_avoided_kg - a.co2_avoided_kg
        return b.gain_credits_eur - a.gain_credits_eur
      })

      trajet = sorted[0] ?? null
    }

    // 7. Piocher 1 micro-défi positif
    const microDefi = pickMicroDefi()

    // 8. Retourner la surprise complète
    return NextResponse.json(
      {
        destination: {
          id: chosen.id,
          slug: chosen.slug,
          title: chosen.title,
          category: chosen.category,
          city: chosen.city,
          prix: chosen.prix,
          description: chosen.description,
          url_official: chosen.url_official,
          distance_km: chosen._distance_km,
        },
        trajet: trajet
          ? {
              label: trajet.label,
              mode_dominant: trajet.mode_dominant,
              distance_km: trajet.distance_km,
              duration_min: trajet.duration_min,
              cost_eur: trajet.cost_eur,
              co2_avoided_kg: trajet.co2_avoided_kg,
              gain_credits_eur: trajet.gain_credits_eur,
              apaisement_score: trajet.apaisement_score,
            }
          : null,
        micro_defi: {
          texte: microDefi.texte,
          emoji: microDefi.emoji,
          categorie: microDefi.categorie,
        },
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('[yatra/surprise] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 },
    )
  }
}
