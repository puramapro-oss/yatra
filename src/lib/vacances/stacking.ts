import { googleSearchUrl } from './booking-links'

/**
 * VACANCES V2.0 §5 — Stacking automatique.
 * V1 = pile guidée (checklist ordonnée, l'utilisateur clique lui-même dans l'ordre) :
 * pas de partenariat cashback voyage réel en place (yatra.cashback_partners = marques
 * éthiques du quotidien, catégorie 'voyage' vide) — donc pas de faux taux de commission
 * inventé. V2 (liens affiliés propres, transparence affichée) viendra quand de vrais
 * partenariats existeront.
 */

export type StackingStep = {
  id: 'cashback' | 'code_promo' | 'fidelite' | 'paiement'
  titre: string
  conseil: string
  lien?: string
}

export function buildStackingChecklist(params: { merchant: string; typeReservation: 'vol' | 'hotel' | 'activite' | 'location_voiture' }): StackingStep[] {
  const { merchant, typeReservation } = params

  const fideliteConseil: Record<typeof typeReservation, string> = {
    vol: `As-tu un programme de miles avec ${merchant} ou une alliance (SkyTeam, Star Alliance, oneworld) ? Connecte-toi avant de réserver.`,
    hotel: `As-tu un compte fidélité chez cette chaîne (ou via Booking Genius, Accor, IHG…) ? Les niveaux supérieurs débloquent souvent des réductions.`,
    activite: `Certaines activités sont incluses ou réduites via un pass touristique local — vérifie avant de payer à l'unité.`,
    location_voiture: `Un programme de fidélité loueur (Europcar, Hertz, Sixt…) ou une carte de paiement premium inclut parfois une franchise réduite gratuite.`,
  }

  return [
    {
      id: 'cashback',
      titre: '1. Portail cashback',
      conseil: `Vérifie si un portail cashback généraliste que tu utilises déjà (iGraal, Poulpeo, eBuyClub…) référence ${merchant} — clique depuis le portail AVANT de réserver, pas après.`,
      lien: googleSearchUrl(`cashback ${merchant} iGraal Poulpeo`),
    },
    {
      id: 'code_promo',
      titre: '2. Code promo actif',
      conseil: `Cherche un code promo valide pour ${merchant} avant de payer — teste-le, certains sites l'appliquent automatiquement au panier.`,
      lien: googleSearchUrl(`code promo ${merchant} 2026`),
    },
    {
      id: 'fidelite',
      titre: '3. Programme de fidélité',
      conseil: fideliteConseil[typeReservation],
    },
    {
      id: 'paiement',
      titre: '4. Moyen de paiement',
      conseil: "Privilégie une carte avec cashback voyage si tu en as une. Vérifie aussi les frais de change si tu paies à l'étranger (certaines cartes les suppriment).",
    },
  ]
}
