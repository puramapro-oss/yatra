/**
 * Programme Ambassadeur YATRA — créateur/influenceur reçoit commissions sur conversions.
 *
 * Tier upgrade auto selon total_earnings_eur cumulé :
 *  Bronze     0€   → 10% commission
 *  Argent     150€ → 11%
 *  Or         400€ → 12%
 *  Platine    1000€ → 13%
 *  Diamant    3000€ → 15%
 *  Légende    6500€ → 17%
 *  Titan      50000€ → 20%
 *  Éternel    100000€ → 25%
 *
 * Slug : a-z, 0-9, dash. 3-30 chars. Unique.
 */

export const AMBASSADOR_TIERS = ['bronze', 'argent', 'or', 'platine', 'diamant', 'legende', 'titan', 'eternel'] as const
export type AmbassadorTier = (typeof AMBASSADOR_TIERS)[number]

export type TierConfig = {
  tier: AmbassadorTier
  label: string
  emoji: string
  threshold_eur: number
  commission_pct: number
  perks: string[]
}

export const TIER_CONFIG: Record<AmbassadorTier, TierConfig> = {
  bronze: {
    tier: 'bronze', label: 'Bronze', emoji: '🥉', threshold_eur: 0, commission_pct: 10,
    perks: ['Lien personnel /go/[slug]', 'Kit créateur (logos + bannières)', 'Plan Starter offert'],
  },
  argent: {
    tier: 'argent', label: 'Argent', emoji: '🥈', threshold_eur: 150, commission_pct: 11,
    perks: ['Plan Pro offert', 'Early access features 7j', 'Niveau 2 Academy débloqué'],
  },
  or: {
    tier: 'or', label: 'Or', emoji: '🥇', threshold_eur: 400, commission_pct: 12,
    perks: ['Plan Unlimited offert', 'Page perso /p/[slug]', 'Coach IA Aria 50 msg/j'],
  },
  platine: {
    tier: 'platine', label: 'Platine', emoji: '💎', threshold_eur: 1000, commission_pct: 13,
    perks: ['Plan Enterprise offert', 'Feature priority requests', 'Événements VIP'],
  },
  diamant: {
    tier: 'diamant', label: 'Diamant', emoji: '💠', threshold_eur: 3000, commission_pct: 15,
    perks: ['Statut VIP', 'Niveau 3 Academy', 'Direct line CEO'],
  },
  legende: {
    tier: 'legende', label: 'Légende', emoji: '⭐', threshold_eur: 6500, commission_pct: 17,
    perks: ['Beta 1 an avant tous', 'Commissions héréditaires N2', 'Mention écrans accueil'],
  },
  titan: {
    tier: 'titan', label: 'Titan', emoji: '🏔️', threshold_eur: 50000, commission_pct: 20,
    perks: ['Ligne Tissma directe', 'Co-création feature', 'Dividendes simulés'],
  },
  eternel: {
    tier: 'eternel', label: 'Éternel', emoji: '✨', threshold_eur: 100000, commission_pct: 25,
    perks: ['1% parts SASU virtuel', 'Commission héréditaire vie', 'Conseil stratégique'],
  },
}

export function tierFromEarnings(earningsEur: number): AmbassadorTier {
  let current: AmbassadorTier = 'bronze'
  for (const t of AMBASSADOR_TIERS) {
    if (earningsEur >= TIER_CONFIG[t].threshold_eur) current = t
  }
  return current
}

export function nextTier(current: AmbassadorTier): { next: AmbassadorTier | null; threshold_eur: number | null; remaining_eur: number | null } {
  const idx = AMBASSADOR_TIERS.indexOf(current)
  if (idx >= AMBASSADOR_TIERS.length - 1) return { next: null, threshold_eur: null, remaining_eur: null }
  const nextT = AMBASSADOR_TIERS[idx + 1]
  return {
    next: nextT,
    threshold_eur: TIER_CONFIG[nextT].threshold_eur,
    remaining_eur: TIER_CONFIG[nextT].threshold_eur,
  }
}

export const SLUG_REGEX = /^[a-z0-9-]{3,30}$/

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug)
}

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'about', 'auth', 'login', 'signup', 'logout', 'help', 'support',
  'pricing', 'terms', 'privacy', 'legal', 'settings', 'profile', 'dashboard', 'home',
  'yatra', 'purama', 'kaia', 'kash', 'midas', 'sutra', 'aria', 'matiss', 'tissma',
])

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug)
}
