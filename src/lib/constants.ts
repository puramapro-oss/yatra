/**
 * Constantes YATRA.
 * BRIEF §4 + §6 + §11 — pricing 1 plan, split 50/10/10/30, EME ACPR Treezor.
 */

export const SUPER_ADMIN_EMAILS = ['matiss.frasne@gmail.com', 'tissma@purama.dev'] as const
export const APP_NAME = 'YATRA'
export const APP_SLUG = 'yatra'
export const APP_SCHEMA = 'yatra'
export const APP_DOMAIN = 'yatra.purama.dev'

/** BRIEF §6 — split CA mensuel via Treezor (ACPR EME). */
export const REVENUE_SPLIT = {
  USERS_REDISTRIBUTION: 0.5, // 50 % redistribution users (Score d'Humanité)
  ASSO_PURAMA: 0.1, // 10 % Association PURAMA (don convention)
  ADYA_RESERVE: 0.1, // 10 % ADYA — réserve technique
  SASU_PURAMA: 0.3, // 30 % SASU PURAMA (0 % IS ZFRR Frasne)
} as const

/** BRIEF §3.3 — cap ancienneté 12 mois pour multiplicateur Vida Credits. */
export const ANCIENNETE_CAP_MONTHS = 12

/** Wallet retraits (BRIEF §6 + §11 conformité Treezor). */
export const WALLET_MIN_WITHDRAWAL_EUR = 5
export const WALLET_KYC_THRESHOLD_EUR = 1000

/** BRIEF §4 — anti-churn life. */
export const ANTI_CHURN_LIFETIME_PRICE_EUR = 4.99

/** BRIEF §3.18 — 4 rangs progression collective (anti-toxicité). */
export const RANGS = ['explorateur', 'gardien', 'regenerateur', 'legende'] as const
export type Rang = (typeof RANGS)[number]

/** BRIEF §3.9 — 6 modes ambiance multisensoriels. */
export const AMBIANCE_MODES = ['foret', 'pluie', 'ocean', 'feu', 'temple_futuriste', 'silence_sacre'] as const
export type AmbianceMode = (typeof AMBIANCE_MODES)[number]

export const AMBIANCE_LABELS: Record<AmbianceMode, string> = {
  foret: 'Forêt profonde',
  pluie: 'Pluie douce',
  ocean: 'Océan',
  feu: 'Feu de camp',
  temple_futuriste: 'Temple futuriste',
  silence_sacre: 'Silence sacré',
}

/** BRIEF §11 — 29 langues réutiliser système YANA. */
export const SUPPORTED_LOCALES = [
  'fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'sv', 'da', 'no', 'fi',
  'cs', 'el', 'hu', 'ro', 'bg', 'tr', 'ar', 'he', 'ru', 'uk',
  'zh', 'ja', 'ko', 'hi', 'th', 'vi', 'id',
] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** Société. */
export const COMPANY_INFO = {
  name: 'PURAMA',
  legalName: 'SASU PURAMA',
  address: '8 Rue Chapelle, 25560 Frasne',
  zfrr: true,
  asso: 'Association PURAMA',
  tvaApplicable: false,
  tvaMention: 'TVA non applicable, art. 293 B du CGI',
  contactEmail: 'contact@purama.dev',
  dpoEmail: 'matiss.frasne@gmail.com',
} as const

/** Écosystème PURAMA — cross-promo. */
export const PURAMA_ECOSYSTEM = [
  { slug: 'kosha', name: 'KOSHA', domain: 'kosha.purama.dev', tagline: 'Corps & énergie subtile' },
  { slug: 'vida', name: 'VIDA', domain: 'vida.purama.dev', tagline: 'Santé totale' },
  { slug: 'kaia', name: 'KAÏA', domain: 'kaia.purama.dev', tagline: 'Bien-être quotidien' },
  { slug: 'jurispurama', name: 'JurisPurama', domain: 'jurispurama.purama.dev', tagline: 'Droit & aides' },
  { slug: 'midas', name: 'MIDAS', domain: 'midas.purama.dev', tagline: 'Trading' },
  { slug: 'sutra', name: 'SUTRA', domain: 'sutra.purama.dev', tagline: 'Cinéma IA' },
  { slug: 'adya', name: 'ADYA', domain: 'adya.purama.dev', tagline: 'Réserve technique' },
  { slug: 'akasha-ai', name: 'AKASHA', domain: 'akasha.purama.dev', tagline: 'Multi-experts IA' },
] as const
