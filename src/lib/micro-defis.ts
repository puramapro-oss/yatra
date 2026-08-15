/**
 * Micro-défis positifs pour "Surprise parfaite" (P18).
 * Liste curatée de défis ultra-simples, actionnables, bienveillants.
 * Ton YATRA : doux, non-jugeant, présence consciente.
 */

export type MicroDefi = {
  id: string
  texte: string
  emoji: string
  categorie: 'presence' | 'gratitude' | 'observation' | 'lien' | 'souffle'
}

export const MICRO_DEFIS: MicroDefi[] = [
  {
    id: 'sourire-chemin',
    texte: 'Souris à une personne croisée en chemin',
    emoji: '😊',
    categorie: 'lien',
  },
  {
    id: 'observer-details',
    texte: 'Observe 3 détails que tu ne vois jamais d\'habitude',
    emoji: '👁️',
    categorie: 'observation',
  },
  {
    id: 'photo-ciel',
    texte: 'Prends une photo du ciel avant de partir',
    emoji: '📸',
    categorie: 'presence',
  },
  {
    id: 'dire-merci',
    texte: 'Dis merci à quelqu\'un aujourd\'hui',
    emoji: '🙏',
    categorie: 'gratitude',
  },
  {
    id: 'fermer-yeux',
    texte: 'Ferme les yeux 30 secondes et écoute les sons autour de toi',
    emoji: '🎧',
    categorie: 'presence',
  },
  {
    id: 'noter-surprise',
    texte: 'Note une chose qui t\'a surpris·e aujourd\'hui',
    emoji: '✨',
    categorie: 'observation',
  },
  {
    id: 'sourire-service',
    texte: 'Offre ton sourire à la caissière ou au serveur',
    emoji: '💚',
    categorie: 'lien',
  },
  {
    id: 'compter-couleurs',
    texte: 'Compte 10 couleurs différentes sur le trajet',
    emoji: '🌈',
    categorie: 'observation',
  },
  {
    id: 'compliment-sincere',
    texte: 'Fais un compliment sincère à quelqu\'un',
    emoji: '💫',
    categorie: 'lien',
  },
  {
    id: 'respirer-profond',
    texte: 'Respire profondément 3 fois avant d\'arriver',
    emoji: '🌬️',
    categorie: 'souffle',
  },
  {
    id: 'toucher-arbre',
    texte: 'Touche un arbre et ressens son écorce 10 secondes',
    emoji: '🌳',
    categorie: 'presence',
  },
  {
    id: 'marcher-pieds-nus',
    texte: 'Si tu peux, marche pieds nus sur l\'herbe 2 minutes',
    emoji: '🦶',
    categorie: 'presence',
  },
  {
    id: 'ecouter-oiseau',
    texte: 'Écoute le chant d\'un oiseau et essaie de l\'imiter',
    emoji: '🐦',
    categorie: 'observation',
  },
  {
    id: 'remercier-terre',
    texte: 'Remercie la Terre pour ce moment',
    emoji: '🌍',
    categorie: 'gratitude',
  },
  {
    id: 'pause-conscience',
    texte: 'Fais une pause de 1 minute en pleine conscience',
    emoji: '⏸️',
    categorie: 'presence',
  },
  {
    id: 'observer-nuages',
    texte: 'Observe les formes des nuages pendant 2 minutes',
    emoji: '☁️',
    categorie: 'observation',
  },
  {
    id: 'saluer-soleil',
    texte: 'Salue le soleil (ou la pluie) avec reconnaissance',
    emoji: '☀️',
    categorie: 'gratitude',
  },
  {
    id: 'marcher-lent',
    texte: 'Marche très lentement pendant 1 minute, en conscience',
    emoji: '🐌',
    categorie: 'presence',
  },
  {
    id: 'sentir-air',
    texte: 'Ressens l\'air sur ta peau et goûte sa température',
    emoji: '🍃',
    categorie: 'presence',
  },
  {
    id: 'ecrire-intention',
    texte: 'Écris une intention pour cette sortie',
    emoji: '✍️',
    categorie: 'presence',
  },
]

/**
 * Pioche 1 micro-défi aléatoire (seeded si besoin pour éviter répétition immédiate).
 */
export function pickMicroDefi(seed?: number): MicroDefi {
  const index = seed != null ? seed % MICRO_DEFIS.length : Math.floor(Math.random() * MICRO_DEFIS.length)
  return MICRO_DEFIS[index]!
}
