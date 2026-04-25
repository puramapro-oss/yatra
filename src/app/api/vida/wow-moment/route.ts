import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { estimateMonthlyGain, estimateMonthlyCo2Avoided, estimateAidesCount } from '@/lib/wow'
import type { HabitudesMobilite, MomentWow } from '@/types/vida'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const querySchema = z.object({
  ville: z.string().min(2).max(100),
  pays: z.string().length(2).default('FR'),
  habitudes: z.object({
    mode_dominant: z.enum([
      'marche', 'velo', 'trottinette', 'transport_public', 'covoiturage',
      'voiture_perso', 'avion', 'train',
    ]),
    km_propre_semaine: z.number().min(0).max(2000),
    km_carbone_semaine: z.number().min(0).max(5000),
    modes_secondaires: z.array(z.enum([
      'marche', 'velo', 'trottinette', 'transport_public', 'covoiturage',
      'voiture_perso', 'avion', 'train',
    ])).max(4),
  }),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const data = querySchema.parse(body)

    // 1. Calcul gain mensuel & CO₂ évité — purs, déterministes
    const habitudes: HabitudesMobilite = data.habitudes
    const gainMensuel = estimateMonthlyGain(habitudes)
    const co2Evite = estimateMonthlyCo2Avoided(habitudes)

    // 2. Estimation aides — heuristique conservative (P5 fera vraie recherche Tavily)
    const aides = estimateAidesCount({ pays: data.pays, ville: data.ville })

    // 3. Première action suggérée
    const firstAction = pickFirstAction(habitudes)

    // 4. Top villes voisines pertinentes (statique pour P2, dynamique P3+)
    const villesTop = topVilles(data.ville, data.pays)

    const wow: MomentWow = {
      gain_mensuel_estime_eur: gainMensuel,
      km_propre_semaine: habitudes.km_propre_semaine,
      co2_evite_mensuel_kg: co2Evite,
      aides_detectees_count: aides.count,
      aides_potentielles_eur: aides.potentielEur,
      premier_action: firstAction,
      villes_top: villesTop,
    }

    return NextResponse.json(wow)
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function pickFirstAction(habitudes: HabitudesMobilite): MomentWow['premier_action'] {
  const dominant = habitudes.mode_dominant
  if (dominant === 'velo' || dominant === 'trottinette') {
    return {
      label: `Tracker ton premier trajet ${dominant === 'velo' ? '🚲' : '🛴'}`,
      href: '/dashboard/trajet',
      estimated_time_seconds: 30,
    }
  }
  if (dominant === 'marche') {
    return {
      label: 'Tracker tes premiers 1 000 pas 🚶',
      href: '/dashboard/trajet',
      estimated_time_seconds: 30,
    }
  }
  if (dominant === 'transport_public' || dominant === 'train') {
    return {
      label: 'Voir ton premier achat groupé 🎫',
      href: '/dashboard/groupe',
      estimated_time_seconds: 45,
    }
  }
  if (dominant === 'covoiturage') {
    return {
      label: 'Activer ton radar covoit local 🚙',
      href: '/dashboard/trajet',
      estimated_time_seconds: 30,
    }
  }
  return {
    label: 'Découvrir tes droits & aides 📜',
    href: '/dashboard/aides',
    estimated_time_seconds: 60,
  }
}

function topVilles(ville: string, pays: string): string[] {
  if (pays !== 'FR') return [ville]
  // Liste statique villes "chères" en transport — ajout valeur ressentie pour user.
  return ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Strasbourg'].filter((v) => v.toLowerCase() !== ville.toLowerCase()).slice(0, 3)
}
