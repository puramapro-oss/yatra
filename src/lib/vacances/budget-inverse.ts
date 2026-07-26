import { googleFlightsUrl, bookingUrl, googleSearchUrl } from './booking-links'

/**
 * VACANCES V2.0 §2 — Budget inversé (écran signature).
 * "J'ai X€ et Y jours" → 5 yatrages complets chiffrés, triés par ajustement au budget
 * puis par correspondance aux envies. Toujours 5 résultats (catalogue ≥5 destinations),
 * jamais un prix de billet inventé : fourchettes min/max issues du catalogue de référence.
 */

export type Destination = {
  nom: string
  pays: string
  tags: string[]
  modes_transport: string[]
  cout_transport_ar_min_eur: number
  cout_transport_ar_max_eur: number
  cout_logement_nuit_min_eur: number
  cout_logement_nuit_max_eur: number
  cout_repas_jour_min_eur: number
  cout_repas_jour_max_eur: number
  cout_activite_jour_min_eur: number
  cout_activite_jour_max_eur: number
  description: string | null
}

export type BudgetLine = { label: string; min: number; max: number }

export type BudgetProposition = {
  destination: string
  pays: string
  totalMin: number
  totalMax: number
  budgetRespecte: boolean
  ecartBudgetEur: number
  breakdown: BudgetLine[]
  tagsMatch: string[]
  description: string | null
  liens: { transport: string; logement: string; activites: string }
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function generateBudgetPropositions(
  params: { budgetEur: number; jours: number; envies: string[]; depart: string },
  destinations: Destination[],
): BudgetProposition[] {
  const { budgetEur, jours, envies, depart } = params

  const scored = destinations.map((d) => {
    const transportMin = d.cout_transport_ar_min_eur
    const transportMax = d.cout_transport_ar_max_eur
    const logementMin = d.cout_logement_nuit_min_eur * jours
    const logementMax = d.cout_logement_nuit_max_eur * jours
    const repasMin = d.cout_repas_jour_min_eur * jours
    const repasMax = d.cout_repas_jour_max_eur * jours
    const activiteMin = d.cout_activite_jour_min_eur * jours
    const activiteMax = d.cout_activite_jour_max_eur * jours

    const totalMin = transportMin + logementMin + repasMin + activiteMin
    const totalMax = transportMax + logementMax + repasMax + activiteMax
    const budgetRespecte = totalMin <= budgetEur
    const tagsMatch = d.tags.filter((t) => envies.includes(t))

    let score = 0
    if (totalMin <= budgetEur) {
      score += Math.min(1, totalMin / budgetEur) * 60
    } else {
      const overshoot = (totalMin - budgetEur) / budgetEur
      score += Math.max(0, 40 - overshoot * 100)
    }
    score += tagsMatch.length * 15

    const proposition: BudgetProposition = {
      destination: d.nom,
      pays: d.pays,
      totalMin: round2(totalMin),
      totalMax: round2(totalMax),
      budgetRespecte,
      ecartBudgetEur: round2(totalMin - budgetEur),
      tagsMatch,
      description: d.description,
      breakdown: [
        { label: 'Transport aller-retour', min: transportMin, max: transportMax },
        { label: `Logement (${jours} nuit${jours > 1 ? 's' : ''})`, min: round2(logementMin), max: round2(logementMax) },
        { label: `Repas (${jours} jour${jours > 1 ? 's' : ''})`, min: round2(repasMin), max: round2(repasMax) },
        { label: `Activités (${jours} jour${jours > 1 ? 's' : ''})`, min: round2(activiteMin), max: round2(activiteMax) },
      ],
      liens: {
        transport: googleFlightsUrl(depart, d.nom),
        logement: bookingUrl(d.nom),
        activites: googleSearchUrl(`activités incontournables ${d.nom} ${jours} jours`),
      },
    }

    return { proposition, score }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, 5).map(({ proposition }) => proposition)
}
