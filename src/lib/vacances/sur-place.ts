/**
 * VACANCES V2.0 §7 — Sur place.
 * Repas anti-gaspi (redirection Too Good To Go, pas de marketplace propre) + villes à
 * transports gratuits (faits publics documentés) + calculateur de pass touristique
 * (générique, l'utilisateur entre ses propres prix — pas de données figées par ville
 * qui deviendraient vite fausses). Missions rémunérées locales via KARMA/VIDA JOB :
 * VIDA JOB n'existe pas encore dans l'écosystème Purama — flag "bientôt", pas de fausse
 * mission inventée.
 */

export const VILLES_TRANSPORT_GRATUIT: { ville: string; pays: string; depuis: string; description: string }[] = [
  { ville: 'Dunkerque', pays: 'France', depuis: '2018', description: "Premier réseau 100% gratuit d'une agglomération de cette taille en France (DK'BUS)." },
  { ville: 'Niort', pays: 'France', depuis: '2017', description: 'Bus gratuits pour tous, week-ends et soirs compris.' },
  { ville: 'Aubagne', pays: 'France', depuis: '2009', description: 'Un des tout premiers réseaux gratuits de France (bus).' },
  { ville: 'Calais', pays: 'France', depuis: '2020', description: 'Réseau de bus urbain gratuit.' },
  { ville: 'Châteauroux', pays: 'France', depuis: '2001', description: 'Un des pionniers historiques de la gratuité des transports en France.' },
  { ville: 'Luxembourg', pays: 'Luxembourg', depuis: '2020', description: 'Premier pays au monde avec des transports publics gratuits sur tout le territoire (train, tram, bus).' },
  { ville: 'Tallinn', pays: 'Estonie', depuis: '2013', description: 'Gratuit pour les résidents enregistrés (pas pour les touristes de passage — vérifie les conditions).' },
]

export const REPAS_ANTI_GASPI = {
  nom: 'Too Good To Go',
  url: 'https://www.toogoodtogo.com/fr',
  description: "Paniers surprise à -50/70% chez des boulangeries, restaurants et supermarchés partenaires, pour écouler les invendus du jour.",
  commentCaMarche: [
    "Installe l'app et active la localisation dans ta destination.",
    'Réserve un panier surprise (contenu non garanti à l\'avance, c\'est le principe anti-gaspi).',
    "Récupère-le au créneau horaire indiqué par le commerçant.",
  ],
}

export function calculerRentabilitePass(prixPassEur: number, activites: { nom: string; prixEur: number }[]) {
  const totalIndividuelEur = Math.round(activites.reduce((s, a) => s + a.prixEur, 0) * 100) / 100
  const economieEur = Math.round((totalIndividuelEur - prixPassEur) * 100) / 100
  return {
    totalIndividuelEur,
    economieEur,
    rentable: economieEur > 0,
  }
}
