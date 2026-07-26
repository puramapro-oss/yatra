/**
 * VACANCES V2.0 §9 — Repositionnement & dernière minute.
 * V1 : redirection vers plateformes existantes (pas de marketplace propre) + guide.
 * Convoyage de véhicules/camping-cars et location aller simple = trajet quasi gratuit
 * (le propriétaire/loueur a besoin que le véhicule change de ville). Croisières dernière
 * minute = cabines invendues à -70%. Vols de repositionnement = aucune plateforme grand
 * public fiable identifiée à ce jour → contenu guide uniquement, jamais de lien inventé.
 */

export type CanalRepositionnement = {
  id: 'convoyage_vehicule' | 'location_aller_simple'
  titre: string
  description: string
  commentCaMarche: string[]
  checklistSecurite: string[]
  plateformes: { nom: string; url: string }[]
}

export const CANAUX_REPOSITIONNEMENT: CanalRepositionnement[] = [
  {
    id: 'convoyage_vehicule',
    titre: 'Convoyage de véhicule',
    description: "Un particulier ou une agence a besoin qu'une voiture, un utilitaire ou un camping-car change de ville — tu le conduis, le trajet ne te coûte quasiment rien (essence et péages pris en charge, parfois une petite rémunération).",
    commentCaMarche: [
      'Crée un profil (permis valide, expérience de conduite) sur une plateforme de convoyage entre particuliers ou professionnelle.',
      "Postule aux trajets qui t'intéressent, échange avec le donneur d'ordre sur les conditions exactes (prise en charge frais, délai, kilométrage).",
      "Fais un état des lieux photo du véhicule au départ et à l'arrivée.",
    ],
    checklistSecurite: [
      "Vérifie que l'assurance du véhicule couvre bien le trajet et ton profil de conducteur avant de partir.",
      "Exige un contrat ou accord écrit (dates, kilométrage, qui paie quoi) avant de prendre la route.",
      'Photographie tout dommage existant sur le véhicule avant le départ.',
      'Ne verse jamais de caution en dehors du cadre officiel de la plateforme.',
    ],
    plateformes: [
      { nom: 'DriiveMe', url: 'https://www.driiveme.com/' },
      { nom: 'Cocolis', url: 'https://www.cocolis.fr/' },
      { nom: 'Otoqi', url: 'https://www.otoqi.com/' },
    ],
  },
  {
    id: 'location_aller_simple',
    titre: 'Location aller simple à prix cassé',
    description: "Certaines agences doivent rapatrier des véhicules (parfois camping-cars) d'une agence vers une autre et bradent la location aller simple sur ces trajets — parfois jusqu'à 1€ + carburant.",
    commentCaMarche: [
      "Consulte régulièrement les pages 'aller simple' des loueurs — les trajets bradés changent selon leurs besoins de rapatriement.",
      'Réserve tôt : les créneaux les plus avantageux partent vite.',
      'Pour les camping-cars, vérifie directement les offres de repositionnement chez les loueurs spécialisés (disponibilité rare et variable selon la saison).',
    ],
    checklistSecurite: [
      "Lis les conditions du tarif réduit (délai imposé, kilométrage limité, agence de retour imposée).",
      "Vérifie l'état des lieux et les franchises d'assurance avant de signer.",
    ],
    plateformes: [
      { nom: 'Europcar One Way', url: 'https://www.europcar.fr/location-voiture/aller-simple' },
      { nom: 'Hertz One (aller simple)', url: 'https://www.hertz.fr/location-voiture/aller-simple' },
      { nom: 'Rent A Car — aller simple', url: 'https://www.rentacar.fr/aller-simple/233-location-voiture-aller-simple' },
    ],
  },
]

export const CROISIERES_DERNIERE_MINUTE = {
  description: "Les compagnies bradent leurs cabines invendues ou les désistements de dernière minute — jusqu'à -70% sur des départs proches, à condition de rester flexible sur dates et destination.",
  conseils: [
    'Reste flexible sur la date de départ, la durée et la destination — les meilleures affaires ne se choisissent pas à l\'avance.',
    "Compare plusieurs plateformes de déstockage avant de réserver : les mêmes cabines n'y sont pas toujours au même prix.",
    'Vérifie ce qui est inclus (pension, taxes portuaires, pourboires) avant de comparer deux offres — le prix affiché seul ne suffit pas.',
  ],
  plateformes: [
    { nom: 'AB Croisière — dernière minute', url: 'https://www.abcroisiere.com/fr/croisieres/croisiere-derniere-minute/' },
    { nom: 'Promo Croisière — dernière minute', url: 'https://www.promocroisiere.com/fr/croisieres/croisiere-derniere-minute/' },
    { nom: 'Croisière Club — dernière minute', url: 'https://www.croisiere-club.com/croisieres-derniere-minute.html' },
    { nom: 'MSC Croisières — dernière minute', url: 'https://www.msccroisieres.fr/offres/derniere-minute' },
  ],
}

export const VOLS_REPOSITIONNEMENT = {
  description: "Une compagnie doit parfois ramener un avion vide vers sa base ou son prochain vol — ces vols dits « de repositionnement » sont parfois ouverts à la vente à prix cassé, mais sans annonce garantie ni plateforme dédiée fiable : à repérer au cas par cas.",
  commentReperer: [
    "Suis les comptes réseaux sociaux et newsletters des compagnies low-cost et charters de tes destinations habituelles — c'est souvent là qu'elles annoncent ces vols en dernière minute.",
    "Active une recherche flexible (dates ± 3 jours, aéroports proches) sur un comparateur de vols : un repositionnement se traduit souvent par un prix anormalement bas sur un vol isolé.",
    'Ne compte jamais uniquement sur ce type de vol pour un voyage planifié à l\'avance — traite-le comme une opportunité, pas un plan.',
  ],
}

/** Économie réalisée = ce que tu aurais payé au tarif normal - ce que tu as réellement payé (déclaratif, jamais estimé à ta place). */
export function calculerEconomieRepositionnement(prixNormalEstimeEur: number, prixPayeEur: number) {
  return { economieEur: Math.max(0, Math.round((prixNormalEstimeEur - prixPayeEur) * 100) / 100) }
}
