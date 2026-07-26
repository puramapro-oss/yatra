import { haversineKm, type Coord } from '@/lib/geo'

/**
 * VACANCES V2.0 §4.1 — Indemnisation vols (Règlement CE 261/2004).
 * V1 déclaratif : l'utilisateur saisit lui-même son vol + l'incident constaté
 * (pas de suivi automatique des statuts de vol — aucune API de tracking disponible).
 * L'app évalue l'éligibilité et génère la lettre ; elle n'envoie rien et ne touche
 * jamais l'argent (0% commission, l'utilisateur envoie lui-même sa réclamation).
 */

export type Eu261Eligibilite = 'oui' | 'non' | 'incertain'

export type Eu261Input = {
  typeIncident: 'retard' | 'annulation' | 'refus_embarquement'
  retardHeures: number | null
  joursNoticeAnnulation: number | null
  circonstancesExtraordinairesInvoquees: boolean
  departUE: boolean
  arriveeUE: boolean
  compagnieUE: boolean
}

export type Eu261Result = {
  eligibilite: Eu261Eligibilite
  motif: string
  montantEstimeEur: number
}

/** Distance vol en km — utilisée pour déterminer le montant (Art. 7 du règlement). */
export function eu261Distance(depart: Coord, arrivee: Coord): number {
  return Math.round(haversineKm(depart, arrivee) * 10) / 10
}

/**
 * Montant selon distance (Art. 7.1) — 250€ / 400€ / 600€, réduit de 50% (Art. 7.2.c)
 * si retard à l'arrivée < 4h pour les vols > 3500km.
 */
export function eu261CompensationAmount(distanceKm: number, retardHeures: number | null): number {
  if (distanceKm <= 1500) return 250
  if (distanceKm <= 3500) return 400
  if (retardHeures !== null && retardHeures < 4) return 300
  return 600
}

export function eu261CheckEligibility(input: Eu261Input & { distanceKm: number }): Eu261Result {
  const { typeIncident, retardHeures, joursNoticeAnnulation, circonstancesExtraordinairesInvoquees, departUE, arriveeUE, compagnieUE, distanceKm } = input

  const champApplication = departUE || (arriveeUE && compagnieUE)
  if (!champApplication) {
    return {
      eligibilite: 'non',
      motif: "Le règlement CE 261/2004 s'applique aux vols au départ d'un aéroport de l'UE (toute compagnie) ou à destination de l'UE opérés par une compagnie européenne. Ton vol ne remplit aucune de ces deux conditions.",
      montantEstimeEur: 0,
    }
  }

  if (typeIncident === 'retard') {
    if (retardHeures === null || retardHeures < 3) {
      return {
        eligibilite: 'non',
        motif: "Le retard constaté est inférieur à 3h à l'arrivée : le règlement ne prévoit d'indemnisation qu'à partir de 3h de retard.",
        montantEstimeEur: 0,
      }
    }
  }

  if (typeIncident === 'annulation') {
    if (joursNoticeAnnulation !== null && joursNoticeAnnulation >= 14) {
      return {
        eligibilite: 'incertain',
        motif: "Annulation notifiée 14 jours ou plus avant le départ : en général pas d'indemnisation automatique, sauf si la compagnie ne t'a pas proposé de réacheminement dans des délais comparables. À vérifier au cas par cas.",
        montantEstimeEur: 0,
      }
    }
  }

  const montant = eu261CompensationAmount(distanceKm, retardHeures)

  if (circonstancesExtraordinairesInvoquees) {
    return {
      eligibilite: 'incertain',
      motif: "La compagnie invoque des circonstances extraordinaires (météo, grève du contrôle aérien, risque sécurité...). Dans ce cas, l'indemnisation n'est pas automatique — la compagnie doit prouver que ces circonstances ne pouvaient être évitées. Envoie ta réclamation quand même : la charge de la preuve lui incombe.",
      montantEstimeEur: montant,
    }
  }

  return {
    eligibilite: 'oui',
    motif: `Vol éligible : ${typeIncident === 'retard' ? `retard de ${retardHeures}h à l'arrivée` : typeIncident === 'annulation' ? "annulation tardive" : "refus d'embarquement"} sur un trajet de ${Math.round(distanceKm)} km.`,
    montantEstimeEur: montant,
  }
}

export function eu261GenerateLetter(params: {
  nomComplet: string
  compagnie: string
  numeroVol: string
  dateVol: string
  aeroportDepart: string
  aeroportArrivee: string
  typeIncident: 'retard' | 'annulation' | 'refus_embarquement'
  retardHeures: number | null
  montantEstimeEur: number
}): string {
  const { nomComplet, compagnie, numeroVol, dateVol, aeroportDepart, aeroportArrivee, typeIncident, retardHeures, montantEstimeEur } = params

  const natureIncident =
    typeIncident === 'retard'
      ? `un retard à l'arrivée de ${retardHeures} heures`
      : typeIncident === 'annulation'
        ? "l'annulation de mon vol"
        : "un refus d'embarquement (surbooking) alors que je m'étais présenté(e) à l'enregistrement dans les délais requis"

  return `Objet : Demande d'indemnisation — Règlement (CE) n° 261/2004 — Vol ${compagnie} ${numeroVol} du ${dateVol}

Madame, Monsieur,

Je soussigné(e) ${nomComplet}, ai réservé et pris le vol ${compagnie} ${numeroVol} du ${dateVol},
au départ de ${aeroportDepart} à destination de ${aeroportArrivee}.

Ce vol a fait l'objet de ${natureIncident}.

Conformément au règlement (CE) n° 261/2004 du Parlement européen et du Conseil du 11 février 2004,
je vous demande le versement d'une indemnisation de ${montantEstimeEur} euros, montant prévu par
l'article 7 dudit règlement selon la distance du vol concerné.

Je vous remercie de bien vouloir me confirmer la prise en compte de cette réclamation et d'y donner
suite dans un délai de 8 semaines. À défaut de réponse satisfaisante, je me réserve le droit de saisir
la Direction Générale de l'Aviation Civile (DGAC) ou toute autre autorité compétente.

Je reste à votre disposition pour tout justificatif complémentaire (carte d'embarquement, confirmation
de réservation).

Dans l'attente de votre retour,

${nomComplet}

---
Réclamation générée via YATRA (yatra.purama.dev) — assistance gratuite, 0% de commission.
YATRA ne se substitue pas à un service juridique et ne perçoit jamais les sommes réclamées :
la compagnie te répond et te rembourse directement.`
}
