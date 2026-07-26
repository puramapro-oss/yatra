/**
 * VACANCES V2.0 §3 — Logement à 0€.
 * V1 : redirection vers plateformes existantes (pas de marketplace propre), avec guide
 * + checklist sécurité par canal. Économie affichée = calcul réel (nuits × coût logement
 * moyen évité), jamais un chiffre inventé.
 */

export type CanalLogementZero = {
  id: 'house_sitting' | 'echange_maison' | 'volontariat'
  titre: string
  description: string
  commentCaMarche: string[]
  checklistSecurite: string[]
  plateformes: { nom: string; url: string }[]
  synergiePashu?: boolean
}

export const CANAUX_LOGEMENT_ZERO: CanalLogementZero[] = [
  {
    id: 'house_sitting',
    titre: 'House-sitting',
    description: "Tu gardes la maison (et souvent les animaux) de quelqu'un pendant son absence — logement gratuit en échange.",
    commentCaMarche: [
      "Crée un profil détaillé (expérience, disponibilités, avec ou sans animaux).",
      "Postule aux annonces qui t'intéressent, échange avec le propriétaire en visio avant de confirmer.",
      "Sur place : respecte les consignes laissées (plantes, animaux, courrier).",
    ],
    checklistSecurite: [
      "Vérifie les avis du propriétaire sur la plateforme avant de postuler.",
      "Fais un appel visio avant de t'engager — jamais d'échange uniquement par message.",
      "Demande un contrat ou accord écrit même informel (dates, attentes, contact d'urgence).",
      "Ne communique jamais tes coordonnées bancaires en dehors de la plateforme.",
    ],
    plateformes: [
      { nom: 'TrustedHousesitters', url: 'https://www.trustedhousesitters.com/' },
      { nom: 'Mindmysecondhome', url: 'https://www.mindmysecondhome.com/' },
    ],
    synergiePashu: true,
  },
  {
    id: 'echange_maison',
    titre: 'Échange de maison',
    description: 'Tu échanges ton logement avec une autre famille pour la durée du séjour — personne ne paie de nuitée.',
    commentCaMarche: [
      'Inscris ton logement avec photos honnêtes et dates de disponibilité.',
      'Contacte des familles dans tes destinations souhaitées, négocie les dates.',
      "Formalisez l'échange (dates, règles de la maison, état des lieux photo avant/après).",
    ],
    checklistSecurite: [
      'Privilégie les plateformes avec vérification d\'identité et avis vérifiés.',
      "Souscris une assurance habitation qui couvre les échanges (vérifie ton contrat actuel).",
      'Fais un état des lieux photo des deux côtés avant le départ.',
    ],
    plateformes: [
      { nom: 'HomeExchange', url: 'https://www.homeexchange.com/' },
      { nom: 'HomeLink International', url: 'https://www.homelink.org/' },
    ],
  },
  {
    id: 'volontariat',
    titre: 'Volontariat (logé-nourri)',
    description: "Quelques heures de travail par jour (ferme, hébergement, éco-projet) en échange du logement et souvent des repas.",
    commentCaMarche: [
      'Crée un profil avec tes compétences et tes disponibilités.',
      "Contacte les hôtes directement, clarifie les heures attendues et ce qui est inclus (logé/nourri/les deux).",
      'Confirme les conditions par écrit avant de partir (durée, tâches, hébergement).',
    ],
    checklistSecurite: [
      "Vérifie les avis d'anciens volontaires sur cet hôte précis.",
      'Clarifie le nombre d\'heures par jour ET les jours de repos avant de confirmer.',
      "Garde un moyen de contact d'urgence en dehors de l'hôte (famille, ambassade si à l'étranger).",
    ],
    plateformes: [
      { nom: 'Workaway', url: 'https://www.workaway.info/' },
      { nom: 'HelpX', url: 'https://www.helpx.net/' },
      { nom: 'WWOOF France', url: 'https://wwoof.fr/' },
    ],
  },
]

/** Économie réalisée = nuits × coût logement moyen évité (fourchette, jamais un chiffre unique inventé). */
export function calculerEconomieLogement(nuits: number, coutNuitMinEur: number, coutNuitMaxEur: number) {
  return {
    economieMinEur: Math.round(nuits * coutNuitMinEur * 100) / 100,
    economieMaxEur: Math.round(nuits * coutNuitMaxEur * 100) / 100,
  }
}
