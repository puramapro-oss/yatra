import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

/**
 * YATRA pricing — 1 abonnement Premium (BRIEF §4).
 * Free = visuel only, ne peut RIEN faire (effet aspirationnel doux).
 * Premium mensuel 9.99€ (–10% premier mois = 8.99€).
 * Premium annuel 71.93€ (–30% = 5.99€/mois équivalent).
 * Anti-churn : si désabo → "Abo à vie 50%" 4.99€/mois à vie.
 */
export const YATRA_PLANS = {
  free: {
    label: 'Découverte',
    description: 'Tout voir, sans rien activer',
    monthly_eur: 0,
    annual_eur: 0,
    features: [
      'Voir trajets, aides, missions, communauté',
      'Pas de tracking',
      'Pas de gains',
      'Pas de réservation',
    ],
  },
  premium_monthly: {
    label: 'Premium mensuel',
    description: 'Tout débloqué, mois par mois',
    price_eur: 9.99,
    first_month_eur: 8.99,
    interval: 'month' as const,
    features: [
      'GPS tracking trajets propres',
      'Vida Credits illimités',
      'Aides & droits auto remplis',
      '6 modes ambiance multisensoriel',
      'Aria conscience voyage',
      'Tirages au sort + concours',
    ],
  },
  premium_annual: {
    label: 'Premium annuel',
    description: '–30 % vs mensuel',
    price_eur: 71.93,
    monthly_equivalent_eur: 5.99,
    interval: 'year' as const,
    features: [
      'Tout Premium mensuel',
      'Économie 47.95€/an',
      'Bonus ancienneté immédiat',
    ],
  },
  lifetime_anti_churn: {
    label: 'Abo à vie –50 %',
    description: 'Proposition exclusive si tu te désabonnes',
    price_eur: 4.99,
    interval: 'month' as const,
    eligibility: 'sur cancellation flow uniquement',
    features: ['Tout Premium', 'Verrouillé 4.99€/mois à vie'],
  },
} as const

export type YatraPlanKey = keyof typeof YATRA_PLANS

export function formatYatraPrice(plan: YatraPlanKey): string {
  const p = YATRA_PLANS[plan]
  if (plan === 'free') return 'Gratuit'
  if ('price_eur' in p) return `${p.price_eur.toFixed(2).replace('.', ',')} €`
  return ''
}
